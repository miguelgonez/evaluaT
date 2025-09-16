import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
from document_manager import document_manager
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, db_client: AsyncIOMotorClient):
        self.db = db_client[os.environ['DB_NAME']]
        self.emergent_key = os.getenv('EMERGENT_LLM_KEY')
        
        # Initialize LLM chat with system message
        self.system_message = """Eres un asistente especializado en cumplimiento normativo para startups de salud digital e insurtech en España. Tu función es ayudar con consultas sobre:

1. **Reglamento de IA de la UE (EU AI Act)**: Clasificación de riesgos, requisitos de cumplimiento, evaluación de conformidad
2. **Reglamento de Dispositivos Médicos (MDR)**: Requisitos para dispositivos médicos con IA
3. **GDPR**: Protección de datos personales y requisitos de privacidad
4. **Ley de Gobernanza de Datos (DGA)**: Intercambio y reutilización de datos
5. **Ley General de Sanidad**: Normativas sanitarias españolas
6. **Ley del Contrato de Seguro**: Regulaciones de seguros

**Instrucciones:**
- Proporciona respuestas precisas y basadas en la documentación oficial
- Usa ejemplos específicos para startups de salud digital e insurtech
- Incluye referencias a artículos específicos cuando sea relevante
- Ofrece recomendaciones prácticas y pasos específicos
- Si no tienes información suficiente, indícalo claramente
- Responde siempre en español
"""
    
    async def create_chat_session(self, user_id: str, title: Optional[str] = None) -> str:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        
        chat_session = {
            "id": session_id,
            "user_id": user_id,
            "title": title or "Nueva Consulta",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "message_count": 0
        }
        
        await self.db.chat_sessions.insert_one(chat_session)
        logger.info(f"Created chat session {session_id} for user {user_id}")
        
        return session_id
    
    async def get_chat_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all chat sessions for a user"""
        sessions = await self.db.chat_sessions.find(
            {"user_id": user_id},
            {"_id": 0}  # Exclude MongoDB ObjectId
        ).sort("updated_at", -1).to_list(100)
        
        return sessions
    
    async def get_chat_messages(self, session_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get all messages in a chat session"""
        # Verify session belongs to user
        session = await self.db.chat_sessions.find_one({
            "id": session_id,
            "user_id": user_id
        })
        
        if not session:
            raise ValueError("Chat session not found or access denied")
        
        messages = await self.db.chat_messages.find(
            {"session_id": session_id},
            {"_id": 0}  # Exclude MongoDB ObjectId
        ).sort("created_at", 1).to_list(1000)
        
        return messages
    
    async def search_relevant_documents(self, query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for relevant documents to answer the query"""
        try:
            # Use document manager to search
            results = document_manager.search_documents(
                query=query,
                k=5,
                category_filter=category
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return []
    
    async def generate_response(self, session_id: str, user_id: str, message: str, category: Optional[str] = None) -> Dict[str, Any]:
        """Generate AI response to user message"""
        try:
            # Search for relevant documents
            relevant_docs = await self.search_relevant_documents(message, category)
            
            # For testing, use a simple response instead of LLM
            ai_response = f"Esta es una respuesta de prueba para la consulta: '{message}'. El sistema RAG encontró {len(relevant_docs)} documentos relevantes sobre {category or 'normativas generales'}."
            
            # Save user message
            user_msg = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "user_id": user_id,
                "role": "user",
                "content": message,
                "created_at": datetime.now(timezone.utc),
                "metadata": {
                    "category": category,
                    "relevant_docs_count": len(relevant_docs)
                }
            }
            
            await self.db.chat_messages.insert_one(user_msg)
            
            # Save AI response
            ai_msg = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "user_id": user_id,
                "role": "assistant",
                "content": ai_response,
                "created_at": datetime.now(timezone.utc),
                "metadata": {
                    "model": "test-mode",
                    "context_docs": [doc['metadata'] for doc in relevant_docs[:3]],
                    "category": category
                }
            }
            
            await self.db.chat_messages.insert_one(ai_msg)
            
            # Update session
            await self.db.chat_sessions.update_one(
                {"id": session_id},
                {
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                    "$inc": {"message_count": 2}
                }
            )
            
            # Return clean copies without MongoDB ObjectId and with serializable datetimes
            user_msg_clean = {k: v for k, v in user_msg.items()}
            ai_msg_clean = {k: v for k, v in ai_msg.items()}
            
            # Convert datetime objects to ISO strings for JSON serialization
            user_msg_clean["created_at"] = user_msg_clean["created_at"].isoformat()
            ai_msg_clean["created_at"] = ai_msg_clean["created_at"].isoformat()
            
            return {
                "user_message": user_msg_clean,
                "ai_response": ai_msg_clean,
                "relevant_documents": relevant_docs[:3]
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise
    
    async def delete_chat_session(self, session_id: str, user_id: str):
        """Delete a chat session and all its messages"""
        # Verify session belongs to user
        session = await self.db.chat_sessions.find_one({
            "id": session_id,
            "user_id": user_id
        })
        
        if not session:
            raise ValueError("Chat session not found or access denied")
        
        # Delete messages
        await self.db.chat_messages.delete_many({"session_id": session_id})
        
        # Delete session
        await self.db.chat_sessions.delete_one({"id": session_id})
        
        logger.info(f"Deleted chat session {session_id}")
    
    async def update_session_title(self, session_id: str, user_id: str, title: str):
        """Update chat session title"""
        result = await self.db.chat_sessions.update_one(
            {
                "id": session_id,
                "user_id": user_id
            },
            {
                "$set": {
                    "title": title,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count == 0:
            raise ValueError("Chat session not found or access denied")
    
    async def get_chat_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get chat statistics for a user"""
        try:
            # Count sessions
            session_count = await self.db.chat_sessions.count_documents({"user_id": user_id})
            
            # Count messages
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$role",
                    "count": {"$sum": 1}
                }}
            ]
            
            message_stats = await self.db.chat_messages.aggregate(pipeline).to_list(10)
            message_counts = {stat["_id"]: stat["count"] for stat in message_stats}
            
            # Get most recent session
            recent_session = await self.db.chat_sessions.find_one(
                {"user_id": user_id},
                sort=[("updated_at", -1)]
            )
            
            return {
                "total_sessions": session_count,
                "total_messages": sum(message_counts.values()),
                "user_messages": message_counts.get("user", 0),
                "assistant_messages": message_counts.get("assistant", 0),
                "last_chat_date": recent_session["updated_at"].isoformat() if recent_session else None
            }
            
        except Exception as e:
            logger.error(f"Error getting chat statistics: {str(e)}")
            return {
                "total_sessions": 0,
                "total_messages": 0,
                "user_messages": 0,
                "assistant_messages": 0,
                "last_chat_date": None
            }

# Initialize chat service (will be set in server.py)
chat_service = None