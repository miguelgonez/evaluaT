#!/usr/bin/env python3
"""
Admin Service - Sistema de Administración y Actualizaciones Automáticas
Maneja autenticación admin, tareas programadas y mantenimiento del sistema RAG
"""

import os
import sqlite3
import hashlib
import datetime
import asyncio
import schedule
import time
import threading
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
import json
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdminService:
    def __init__(self):
        self.admin_user = "Admin"
        self.admin_password_hash = self._hash_password("Logo.202000%")
        self.db_path = "/app/backend/documents_metadata.db"
        self.init_database()
        self.setup_scheduler()

    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()

    def authenticate_admin(self, username: str, password: str) -> bool:
        """Autenticar administrador"""
        if username == self.admin_user:
            password_hash = self._hash_password(password)
            return password_hash == self.admin_password_hash
        return False

    def init_database(self):
        """Inicializar base de datos SQLite para metadata de documentos"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                url TEXT UNIQUE NOT NULL,
                source TEXT NOT NULL,
                document_type TEXT NOT NULL,
                summary_es TEXT,
                keywords TEXT,
                publication_date DATE,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                category TEXT,
                relevance_score REAL DEFAULT 0.0,
                processed BOOLEAN DEFAULT FALSE
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS update_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                update_type TEXT NOT NULL,
                status TEXT NOT NULL,
                message TEXT,
                documents_processed INTEGER DEFAULT 0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")

    def setup_scheduler(self):
        """Configurar tareas programadas"""
        # Programar actualización diaria a las 6:00 AM
        schedule.every().day.at("06:00").do(self.daily_update_task)
        
        # Iniciar scheduler en hilo separado
        scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        scheduler_thread.start()
        logger.info("Scheduler configured for daily updates at 6:00 AM")

    def _run_scheduler(self):
        """Ejecutar scheduler en hilo separado"""
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    def daily_update_task(self):
        """Tarea de actualización diaria automática"""
        logger.info("Starting daily update task")
        
        try:
            # Actualizar documentos normativos
            docs_updated = self.update_regulatory_documents()
            
            # Actualizar noticias
            news_updated = self.update_news()
            
            # Actualizar artículos y papers expertos
            articles_updated = self.update_expert_documents()
            
            # Actualizar RAG
            self.update_rag_system()
            
            # Registrar en log
            self.log_update("daily_update", "success", 
                          f"Updated: {docs_updated} docs, {news_updated} news, {articles_updated} articles")
            
            logger.info(f"Daily update completed: {docs_updated + news_updated + articles_updated} items processed")
            
        except Exception as e:
            logger.error(f"Daily update failed: {str(e)}")
            self.log_update("daily_update", "error", str(e))

    def update_regulatory_documents(self) -> int:
        """Actualizar documentos normativos desde múltiples fuentes"""
        sources = [
            {
                'name': 'EUR-Lex',
                'base_url': 'https://eur-lex.europa.eu',
                'search_terms': ['artificial intelligence', 'AI Act', 'GDPR', 'medical devices regulation']
            },
            {
                'name': 'BOE',
                'base_url': 'https://www.boe.es',
                'search_terms': ['inteligencia artificial', 'sanidad digital', 'seguros']
            },
            {
                'name': 'AEMPS',
                'base_url': 'https://www.aemps.gob.es',
                'search_terms': ['dispositivos médicos', 'software médico', 'inteligencia artificial']
            }
        ]
        
        documents_updated = 0
        
        for source in sources:
            try:
                docs = self._scrape_regulatory_source(source)
                for doc in docs:
                    if self._add_document_to_db(doc):
                        documents_updated += 1
            except Exception as e:
                logger.error(f"Error updating from {source['name']}: {str(e)}")
        
        return documents_updated

    def update_news(self) -> int:
        """Actualizar noticias regulatorias"""
        news_sources = [
            'https://www.europarl.europa.eu/news/en/press-room',
            'https://www.consilium.europa.eu/en/press/',
            'https://digital-strategy.ec.europa.eu/en/news',
            'https://www.sanidad.gob.es/gabinete/notasPrensa.do'
        ]
        
        news_updated = 0
        
        for source in news_sources:
            try:
                news_items = self._scrape_news_source(source)
                for item in news_items:
                    if self._add_document_to_db(item):
                        news_updated += 1
            except Exception as e:
                logger.error(f"Error updating news from {source}: {str(e)}")
        
        return news_updated

    def update_expert_documents(self) -> int:
        """Actualizar documentos expertos: papers, informes de consultoras, etc."""
        expert_sources = [
            {
                'name': 'McKinsey Digital Health',
                'url': 'https://www.mckinsey.com/industries/healthcare/our-insights',
                'type': 'consultancy'
            },
            {
                'name': 'Deloitte Legal Tech',
                'url': 'https://www2.deloitte.com/global/en/pages/technology/articles/legal-tech.html',
                'type': 'consultancy'
            },
            {
                'name': 'PWC Healthcare',
                'url': 'https://www.pwc.com/gx/en/industries/healthcare.html',
                'type': 'consultancy'
            },
            {
                'name': 'European Commission Digital Health',
                'url': 'https://digital-strategy.ec.europa.eu/en/policies/digital-health',
                'type': 'institution'
            },
            {
                'name': 'WHO Digital Health',
                'url': 'https://www.who.int/health-topics/digital-health',
                'type': 'institution'
            },
            {
                'name': 'OECD Health Tech',
                'url': 'https://www.oecd.org/health/health-technologies/',
                'type': 'institution'
            }
        ]
        
        articles_updated = 0
        
        for source in expert_sources:
            try:
                articles = self._scrape_expert_source(source)
                for article in articles:
                    if self._add_document_to_db(article):
                        articles_updated += 1
            except Exception as e:
                logger.error(f"Error updating from {source['name']}: {str(e)}")
        
        return articles_updated

    def _scrape_regulatory_source(self, source: Dict) -> List[Dict]:
        """Scraping específico para fuentes normativas"""
        documents = []
        
        try:
            # Implementación básica de scraping
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            # Para EUR-Lex
            if source['name'] == 'EUR-Lex':
                for term in source['search_terms']:
                    search_url = f"{source['base_url']}/search.html?scope=EURLEX&text={term}&lang=en"
                    response = requests.get(search_url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        # Lógica específica de EUR-Lex
                        links = soup.find_all('a', class_='title')[:5]  # Limitar a 5 por término
                        
                        for link in links:
                            if link.get('href'):
                                doc = {
                                    'title': link.text.strip(),
                                    'url': source['base_url'] + link.get('href'),
                                    'source': source['name'],
                                    'document_type': 'regulatory',
                                    'category': 'normativo',
                                    'keywords': term
                                }
                                documents.append(doc)
            
        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {str(e)}")
        
        return documents

    def _scrape_news_source(self, url: str) -> List[Dict]:
        """Scraping específico para noticias"""
        news_items = []
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Buscar elementos de noticias (adaptable según la fuente)
                news_elements = soup.find_all(['article', 'div'], class_=['news', 'article', 'press-release'])[:10]
                
                for element in news_elements:
                    title_elem = element.find(['h1', 'h2', 'h3', 'a'])
                    if title_elem and title_elem.text.strip():
                        link_elem = element.find('a')
                        
                        news_item = {
                            'title': title_elem.text.strip(),
                            'url': link_elem.get('href') if link_elem else url,
                            'source': url,
                            'document_type': 'news',
                            'category': 'noticia',
                            'publication_date': datetime.datetime.now().date().isoformat()
                        }
                        news_items.append(news_item)
                        
        except Exception as e:
            logger.error(f"Error scraping news from {url}: {str(e)}")
        
        return news_items

    def _scrape_expert_source(self, source: Dict) -> List[Dict]:
        """Scraping específico para documentos expertos"""
        articles = []
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(source['url'], headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Buscar artículos/papers
                article_elements = soup.find_all(['article', 'div'], class_=['insight', 'publication', 'report'])[:5]
                
                for element in article_elements:
                    title_elem = element.find(['h1', 'h2', 'h3', 'a'])
                    if title_elem and title_elem.text.strip():
                        link_elem = element.find('a')
                        
                        article = {
                            'title': title_elem.text.strip(),
                            'url': link_elem.get('href') if link_elem else source['url'],
                            'source': source['name'],
                            'document_type': 'expert_document',
                            'category': f"experto_{source['type']}",
                            'keywords': 'legaltech, salud digital, insurtech'
                        }
                        articles.append(article)
                        
        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {str(e)}")
        
        return articles

    def _add_document_to_db(self, doc: Dict) -> bool:
        """Agregar documento a la base de datos"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Verificar si ya existe
            cursor.execute("SELECT id FROM documents_metadata WHERE url = ?", (doc['url'],))
            if cursor.fetchone():
                conn.close()
                return False
            
            # Generar resumen en castellano usando LLM
            summary = self._generate_summary(doc['title'])
            
            cursor.execute('''
                INSERT INTO documents_metadata 
                (title, url, source, document_type, summary_es, keywords, category, publication_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                doc['title'],
                doc['url'],
                doc['source'],
                doc['document_type'],
                summary,
                doc.get('keywords', ''),
                doc.get('category', ''),
                doc.get('publication_date', datetime.datetime.now().date().isoformat())
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error adding document to DB: {str(e)}")
            return False

    def _generate_summary(self, title: str) -> str:
        """Generar resumen automático en castellano usando LLM"""
        try:
            from emergentintegrations import LLMService
            
            llm_key = os.getenv('EMERGENT_LLM_KEY')
            if not llm_key:
                return f"Documento sobre {title}"
            
            llm_service = LLMService(api_key=llm_key)
            
            prompt = f"""
            Genera un resumen breve en castellano (máximo 100 palabras) sobre este documento legal/técnico:
            
            Título: {title}
            
            El resumen debe explicar de qué trata el documento y su relevancia para empresas de salud digital e insurtech.
            Usa un lenguaje profesional pero accesible.
            """
            
            response = llm_service.chat_completion(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return f"Documento técnico sobre {title}"

    def update_rag_system(self):
        """Actualizar sistema RAG con nuevos documentos"""
        try:
            # Importar document_manager para actualizar RAG
            from document_manager import DocumentManager
            
            doc_manager = DocumentManager()
            
            # Obtener documentos no procesados
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM documents_metadata WHERE processed = FALSE")
            unprocessed_docs = cursor.fetchall()
            
            for doc in unprocessed_docs:
                try:
                    # Procesar documento en RAG
                    doc_manager.add_document_from_url(doc[2], doc[1])  # url, title
                    
                    # Marcar como procesado
                    cursor.execute("UPDATE documents_metadata SET processed = TRUE WHERE id = ?", (doc[0],))
                    
                except Exception as e:
                    logger.error(f"Error processing document {doc[1]}: {str(e)}")
            
            conn.commit()
            conn.close()
            
            logger.info("RAG system updated successfully")
            
        except Exception as e:
            logger.error(f"Error updating RAG system: {str(e)}")

    def log_update(self, update_type: str, status: str, message: str, documents_processed: int = 0):
        """Registrar actualización en log"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO update_logs (update_type, status, message, documents_processed)
                VALUES (?, ?, ?, ?)
            ''', (update_type, status, message, documents_processed))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error logging update: {str(e)}")

    def get_documents_metadata(self, limit: int = 100, category: str = None) -> List[Dict]:
        """Obtener metadata de documentos para el repositorio"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if category and category != 'all':
                cursor.execute('''
                    SELECT * FROM documents_metadata 
                    WHERE category = ? 
                    ORDER BY last_updated DESC 
                    LIMIT ?
                ''', (category, limit))
            else:
                cursor.execute('''
                    SELECT * FROM documents_metadata 
                    ORDER BY last_updated DESC 
                    LIMIT ?
                ''', (limit,))
            
            rows = cursor.fetchall()
            conn.close()
            
            documents = []
            for row in rows:
                doc = {
                    'id': row[0],
                    'title': row[1],
                    'url': row[2],
                    'source': row[3],
                    'document_type': row[4],
                    'summary_es': row[5],
                    'keywords': row[6],
                    'publication_date': row[7],
                    'last_updated': row[8],
                    'category': row[9],
                    'relevance_score': row[10]
                }
                documents.append(doc)
            
            return documents
            
        except Exception as e:
            logger.error(f"Error getting documents metadata: {str(e)}")
            return []

    def get_update_logs(self, limit: int = 50) -> List[Dict]:
        """Obtener logs de actualizaciones"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM update_logs 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = cursor.fetchall()
            conn.close()
            
            logs = []
            for row in rows:
                log = {
                    'id': row[0],
                    'update_type': row[1],
                    'status': row[2],
                    'message': row[3],
                    'documents_processed': row[4],
                    'timestamp': row[5]
                }
                logs.append(log)
            
            return logs
            
        except Exception as e:
            logger.error(f"Error getting update logs: {str(e)}")
            return []

    def manual_update(self, update_type: str = 'all') -> Dict:
        """Ejecutar actualización manual desde panel admin"""
        try:
            results = {
                'documents': 0,
                'news': 0,
                'articles': 0,
                'status': 'success',
                'message': 'Update completed successfully'
            }
            
            if update_type in ['all', 'documents']:
                results['documents'] = self.update_regulatory_documents()
            
            if update_type in ['all', 'news']:
                results['news'] = self.update_news()
            
            if update_type in ['all', 'articles']:
                results['articles'] = self.update_expert_documents()
            
            if update_type in ['all', 'rag']:
                self.update_rag_system()
            
            total = results['documents'] + results['news'] + results['articles']
            self.log_update(f"manual_{update_type}", "success", 
                          f"Manual update: {total} items processed", total)
            
            return results
            
        except Exception as e:
            logger.error(f"Manual update failed: {str(e)}")
            self.log_update(f"manual_{update_type}", "error", str(e))
            return {
                'status': 'error',
                'message': str(e),
                'documents': 0,
                'news': 0,
                'articles': 0
            }

# Instancia global del servicio
admin_service = AdminService()