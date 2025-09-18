import os
import uuid
import re
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

1. Reglamento de IA de la UE (EU AI Act): Clasificación de riesgos, requisitos de cumplimiento, evaluación de conformidad
2. Reglamento de Dispositivos Médicos (MDR): Requisitos para dispositivos médicos con IA
3. GDPR: Protección de datos personales y requisitos de privacidad
4. Ley de Gobernanza de Datos (DGA): Intercambio y reutilización de datos
5. Ley General de Sanidad: Normativas sanitarias españolas
6. Ley del Contrato de Seguro: Regulaciones de seguros

INSTRUCCIONES IMPORTANTES:
- Proporciona respuestas precisas y basadas en la documentación oficial
- Usa ejemplos específicos para startups de salud digital e insurtech
- Incluye referencias a artículos específicos cuando sea relevante
- Ofrece recomendaciones prácticas y pasos específicos
- Si no tienes información suficiente, indícalo claramente
- Responde siempre en español
- NO uses formato markdown (asteriscos, almohadillas, guiones para listas)
- Usa texto plano con numeración simple: 1., 2., 3.
- Para énfasis usa MAYÚSCULAS en lugar de negritas
- Para separar secciones usa líneas en blanco, no títulos con #
"""
    
    def clean_markdown_response(self, text: str) -> str:
        """Elimina formato markdown de las respuestas del AI"""
        if not text:
            return text
            
        # Eliminar títulos con # (convertir a texto normal)
        text = re.sub(r'^#{1,6}\s*(.+)$', r'\1', text, flags=re.MULTILINE)
        
        # Eliminar negritas y cursivas (** y *)
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Negritas
        text = re.sub(r'\*(.+?)\*', r'\1', text)      # Cursivas
        
        # Convertir listas con guiones a numeradas
        lines = text.split('\n')
        cleaned_lines = []
        list_counter = 1
        
        for line in lines:
            # Convertir listas con - a numeradas
            if re.match(r'^-\s+(.+)', line):
                content = re.sub(r'^-\s+(.+)', r'\1', line)
                cleaned_lines.append(f"{list_counter}. {content}")
                list_counter += 1
            else:
                cleaned_lines.append(line)
                # Reset counter si no es una lista
                if line.strip() and not re.match(r'^-\s+(.+)', line):
                    list_counter = 1
        
        text = '\n'.join(cleaned_lines)
        
        # Eliminar otros caracteres markdown comunes
        text = re.sub(r'`(.+?)`', r'\1', text)        # Código inline
        text = re.sub(r'```[\s\S]*?```', '', text)    # Bloques de código
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)  # Enlaces
        
        return text.strip()
    
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
            
            # Build context from relevant documents
            context = ""
            if relevant_docs:
                context = "\n\n**DOCUMENTACIÓN RELEVANTE:**\n"
                for i, doc in enumerate(relevant_docs[:3], 1):
                    context += f"\n{i}. **{doc['metadata'].get('title', 'Documento')}** (Categoría: {doc['metadata'].get('category', 'N/A')}):\n"
                    context += f"{doc['content'][:500]}...\n"
            
            # Create enhanced prompt with context (reduce cost by limiting context)
            enhanced_message = f"""
**CONSULTA DEL USUARIO:**
{message}

{context[:1000] if context else ""}

**INSTRUCCIONES:**
- Responde de forma concisa y específica para startups de salud digital e insurtech
- Si no tienes información suficiente en el contexto, indícalo
- Menciona artículos específicos si son relevantes
- Responde en español
"""

            # Initialize LLM chat for this session with cheaper model temporarily
            chat = LlmChat(
                api_key=self.emergent_key,
                session_id=session_id,
                system_message=self.system_message
            ).with_model("openai", "gpt-4o-mini")  # Using cheaper model for testing
            
            # Create user message
            user_message = UserMessage(text=enhanced_message)
            
            # Get AI response
            ai_response = await chat.send_message(user_message)
            
            # Save user message
            user_msg_for_db = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "user_id": user_id,
                "role": "user",
                "content": message,
                "created_at": datetime.now(timezone.utc),
                "metadata": {
                    "category": category or "general"
                }
            }
            
            await self.db.chat_messages.insert_one(user_msg_for_db)
            
            # Save AI response
            ai_msg_for_db = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "user_id": user_id,
                "role": "assistant",
                "content": ai_response,
                "created_at": datetime.now(timezone.utc),
                "metadata": {
                    "model": "gpt-4o-mini",
                    "category": category or "general"
                }
            }
            
            await self.db.chat_messages.insert_one(ai_msg_for_db)
            
            # Update session
            await self.db.chat_sessions.update_one(
                {"id": session_id},
                {
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                    "$inc": {"message_count": 2}
                }
            )
            
            # Create completely separate response objects
            current_time = datetime.now(timezone.utc).isoformat()
            
            return {
                "user_message": {
                    "id": user_msg_for_db["id"],
                    "session_id": session_id,
                    "user_id": user_id,
                    "role": "user",
                    "content": message,
                    "created_at": current_time,
                    "metadata": {
                        "category": category or "general"
                    }
                },
                "ai_response": {
                    "id": ai_msg_for_db["id"],
                    "session_id": session_id,
                    "user_id": user_id,
                    "role": "assistant",
                    "content": ai_response,
                    "created_at": current_time,
                    "metadata": {
                        "model": "gpt-4o-mini",
                        "category": category or "general"
                    }
                },
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