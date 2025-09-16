import os
import requests
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timezone
import hashlib
import schedule
import time
from threading import Thread
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import pypdf
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentManager:
    def __init__(self):
        self.docs_path = Path("/app/docs")
        self.normativas_path = self.docs_path / "normativas"
        self.updates_path = self.docs_path / "updates"
        self.knowledge_base_path = self.docs_path / "knowledge_base"
        
        # Ensure directories exist
        for path in [self.normativas_path, self.updates_path, self.knowledge_base_path]:
            path.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB with simpler embeddings for now
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            logger.info("Using HuggingFace embeddings for ChromaDB")
        except Exception as e:
            logger.warning(f"Failed to initialize HuggingFace embeddings: {str(e)}")
            # Fallback to a simple embedding
            from langchain_community.embeddings import FakeEmbeddings
            self.embeddings = FakeEmbeddings(size=384)
            logger.info("Using fake embeddings as fallback")
        
        self.vectorstore = Chroma(
            collection_name="compliance_documents",
            embedding_function=self.embeddings,
            persist_directory=str(self.knowledge_base_path / "chroma_db")
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        # Document sources
        self.document_sources = {
            "EU_AI_ACT": {
                "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1689",
                "title": "Reglamento de IA de la UE (EU AI Act)",
                "category": "ai_regulation",
                "last_updated": None
            },
            "MDR": {
                "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32017R0745",
                "title": "Reglamento de Dispositivos Médicos (MDR)",
                "category": "medical_devices",
                "last_updated": None
            },
            "GDPR": {
                "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679",
                "title": "Reglamento General de Protección de Datos (GDPR)",
                "category": "data_protection",
                "last_updated": None
            },
            "DGA": {
                "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022R0868",
                "title": "Ley de Gobernanza de Datos (DGA)",
                "category": "data_governance",
                "last_updated": None
            },
            "LGS": {
                "url": "https://www.boe.es/buscar/pdf/2006/BOE-A-2006-20551-consolidado.pdf",
                "title": "Ley General de Sanidad",
                "category": "health_law",
                "last_updated": None
            },
            "LEY_SEGUROS": {
                "url": "https://www.boe.es/buscar/pdf/1980/BOE-A-1980-22501-consolidado.pdf",
                "title": "Ley del Contrato de Seguro",
                "category": "insurance_law",
                "last_updated": None
            }
        }
    
    async def download_document(self, doc_id: str, source_info: Dict[str, Any]) -> Optional[str]:
        """Download a document from its source URL"""
        try:
            url = source_info["url"]
            title = source_info["title"]
            category = source_info["category"]
            
            logger.info(f"Downloading document: {title}")
            
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; ComplianceBot/1.0)'})
            response.raise_for_status()
            
            # Create filename
            filename = f"{doc_id}_{category}.pdf"
            file_path = self.normativas_path / filename
            
            # Save file
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            # Update metadata
            source_info["last_updated"] = datetime.now(timezone.utc)
            source_info["local_path"] = str(file_path)
            
            logger.info(f"Successfully downloaded: {title} to {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error downloading document {doc_id}: {str(e)}")
            return None
    
    async def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            logger.info(f"Extracted {len(text)} characters from {file_path}")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            return ""
    
    async def process_document(self, doc_id: str, file_path: str, metadata: Dict[str, Any]):
        """Process document and add to vector store"""
        try:
            # Extract text
            text = await self.extract_text_from_pdf(file_path)
            if not text:
                logger.warning(f"No text extracted from {file_path}")
                return
            
            # Split text into chunks
            chunks = self.text_splitter.split_text(text)
            
            # Create documents with metadata
            documents = []
            for i, chunk in enumerate(chunks):
                doc_metadata = {
                    "source": doc_id,
                    "title": metadata["title"],
                    "category": metadata["category"],
                    "chunk_id": i,
                    "last_updated": metadata["last_updated"].isoformat() if metadata["last_updated"] else None
                }
                documents.append({
                    "text": chunk,
                    "metadata": doc_metadata
                })
            
            # Add to vector store
            texts = [doc["text"] for doc in documents]
            metadatas = [doc["metadata"] for doc in documents]
            
            self.vectorstore.add_texts(
                texts=texts,
                metadatas=metadatas,
                ids=[f"{doc_id}_chunk_{i}" for i in range(len(texts))]
            )
            
            logger.info(f"Added {len(chunks)} chunks from {metadata['title']} to vector store")
            
        except Exception as e:
            logger.error(f"Error processing document {doc_id}: {str(e)}")
    
    async def download_all_documents(self):
        """Download all regulatory documents"""
        logger.info("Starting download of all regulatory documents")
        
        for doc_id, source_info in self.document_sources.items():
            file_path = await self.download_document(doc_id, source_info)
            if file_path:
                await self.process_document(doc_id, file_path, source_info)
        
        logger.info("Completed downloading and processing all documents")
    
    async def update_documents(self):
        """Check for document updates and refresh if needed"""
        logger.info("Checking for document updates")
        
        for doc_id, source_info in self.document_sources.items():
            try:
                # Check if document exists locally
                if "local_path" not in source_info or not Path(source_info["local_path"]).exists():
                    logger.info(f"Document {doc_id} not found locally, downloading...")
                    file_path = await self.download_document(doc_id, source_info)
                    if file_path:
                        await self.process_document(doc_id, file_path, source_info)
                    continue
                
                # Check if document needs updating (weekly check)
                last_updated = source_info.get("last_updated")
                if last_updated:
                    days_since_update = (datetime.now(timezone.utc) - last_updated).days
                    if days_since_update < 7:
                        logger.info(f"Document {doc_id} is up to date")
                        continue
                
                # Try to detect if remote document has changed
                response = requests.head(source_info["url"])
                if response.status_code == 200:
                    # Re-download and process if needed
                    logger.info(f"Re-downloading document {doc_id} for updates")
                    file_path = await self.download_document(doc_id, source_info)
                    if file_path:
                        # Remove old chunks from vector store
                        self.remove_document_chunks(doc_id)
                        await self.process_document(doc_id, file_path, source_info)
                
            except Exception as e:
                logger.error(f"Error updating document {doc_id}: {str(e)}")
    
    def remove_document_chunks(self, doc_id: str):
        """Remove document chunks from vector store"""
        try:
            # Get all chunk IDs for this document
            results = self.vectorstore.get(where={"source": doc_id})
            if results["ids"]:
                self.vectorstore.delete(ids=results["ids"])
                logger.info(f"Removed {len(results['ids'])} chunks for document {doc_id}")
        except Exception as e:
            logger.error(f"Error removing chunks for document {doc_id}: {str(e)}")
    
    def search_documents(self, query: str, k: int = 5, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search documents in vector store"""
        try:
            where_filter = {}
            if category_filter:
                where_filter["category"] = category_filter
            
            results = self.vectorstore.similarity_search(
                query=query,
                k=k,
                filter=where_filter if where_filter else None
            )
            
            search_results = []
            for result in results:
                search_results.append({
                    "content": result.page_content,
                    "metadata": result.metadata,
                    "score": getattr(result, 'score', None)
                })
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return []
    
    def get_document_categories(self) -> List[str]:
        """Get all available document categories"""
        return list(set(source["category"] for source in self.document_sources.values()))
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Get statistics about the document collection"""
        try:
            # Get total number of chunks
            collection = self.vectorstore._collection
            total_chunks = collection.count()
            
            # Get categories
            categories = self.get_document_categories()
            
            # Get last update times
            last_updates = {}
            for doc_id, source in self.document_sources.items():
                if source.get("last_updated"):
                    last_updates[doc_id] = source["last_updated"].isoformat()
            
            return {
                "total_chunks": total_chunks,
                "total_documents": len(self.document_sources),
                "categories": categories,
                "last_updates": last_updates
            }
            
        except Exception as e:
            logger.error(f"Error getting document stats: {str(e)}")
            return {
                "total_chunks": 0,
                "total_documents": len(self.document_sources),
                "categories": self.get_document_categories(),
                "last_updates": {}
            }

# Initialize document manager
document_manager = DocumentManager()

def schedule_updates():
    """Schedule weekly document updates"""
    schedule.every().week.do(lambda: asyncio.run(document_manager.update_documents()))
    
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour

# Start scheduler in background thread
def start_scheduler():
    scheduler_thread = Thread(target=schedule_updates, daemon=True)
    scheduler_thread.start()
    logger.info("Document update scheduler started (weekly updates)")

# Initialize on import
async def initialize_documents():
    """Initialize document collection on startup"""
    try:
        # Check if we have any documents
        stats = document_manager.get_document_stats()
        if stats["total_chunks"] == 0:
            logger.info("No documents found, downloading initial collection...")
            await document_manager.download_all_documents()
        else:
            logger.info(f"Found {stats['total_chunks']} document chunks in {stats['total_documents']} documents")
    
    except Exception as e:
        logger.error(f"Error initializing documents: {str(e)}")