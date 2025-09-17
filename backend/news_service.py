import os
import requests
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import logging
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import hashlib
import schedule
import time
from threading import Thread
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self, db_client: AsyncIOMotorClient):
        self.db = db_client[os.environ['DB_NAME']]
        self.emergent_key = os.getenv('EMERGENT_LLM_KEY')
        
        # News sources for regulatory updates
        self.news_sources = {
            "EUR_LEX": {
                "name": "EUR-Lex",
                "base_url": "https://eur-lex.europa.eu",
                "search_params": {
                    "artificial intelligence": "inteligencia artificial",
                    "medical devices": "dispositivos médicos",
                    "data protection": "protección de datos",
                    "GDPR": "RGPD"
                }
            },
            "BOE": {
                "name": "Boletín Oficial del Estado",
                "base_url": "https://www.boe.es",
                "search_params": {
                    "inteligencia artificial": "artificial intelligence",
                    "dispositivos médicos": "medical devices",
                    "protección datos": "data protection",
                    "seguros": "insurance"
                }
            },
            "AEMPS": {
                "name": "Agencia Española de Medicamentos",
                "base_url": "https://www.aemps.gob.es",
                "topics": ["dispositivos médicos", "IA médica", "regulación sanitaria"]
            },
            "DGSFP": {
                "name": "Dirección General de Seguros",
                "base_url": "https://www.dgsfp.mineco.gob.es",
                "topics": ["seguros", "insurtech", "normativa seguros"]
            }
        }
    
    async def scrape_eur_lex_news(self) -> List[Dict[str, Any]]:
        """Scrape real news from EUR-Lex"""
        news_items = []
        try:
            # Real EUR-Lex search for AI-related legislation
            search_urls = [
                "https://eur-lex.europa.eu/search.html?scope=EURLEX&text=artificial%20intelligence&lang=en&type=quick&qid=1704067200000",
                "https://eur-lex.europa.eu/search.html?scope=EURLEX&text=GDPR%20artificial%20intelligence&lang=en&type=quick",
                "https://eur-lex.europa.eu/search.html?scope=EURLEX&text=medical%20devices%20AI&lang=en&type=quick"
            ]
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; ComplianceNewsBot/1.0)'
            }
            
            for search_url in search_urls:
                try:
                    response = requests.get(search_url, headers=headers, timeout=30)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Look for actual legislation items
                    results = soup.find_all('div', class_='SearchResult')[:3]  # Top 3 per search
                    
                    for result in results:
                        try:
                            title_elem = result.find('a', class_='title')
                            if not title_elem:
                                continue
                            
                            title = title_elem.get_text(strip=True)
                            link = urljoin("https://eur-lex.europa.eu", title_elem.get('href', ''))
                            
                            # Get date if available
                            date_elem = result.find('span', class_='date')
                            date_str = date_elem.get_text(strip=True) if date_elem else None
                            
                            # Get summary
                            summary_elem = result.find('div', class_='summary')
                            summary = summary_elem.get_text(strip=True)[:300] if summary_elem else ""
                            
                            news_items.append({
                                "title": title,
                                "url": link,
                                "summary": summary,
                                "source": "EUR-Lex",
                                "category": "regulation",
                                "date_str": date_str,
                                "language": "en",
                                "scraped_from": "official_source"
                            })
                            
                        except Exception as e:
                            logger.warning(f"Error parsing EUR-Lex result: {str(e)}")
                            continue
                
                except Exception as e:
                    logger.warning(f"Error with search URL {search_url}: {str(e)}")
                    continue
            
            logger.info(f"Scraped {len(news_items)} real items from EUR-Lex")
            
        except Exception as e:
            logger.error(f"Error scraping EUR-Lex: {str(e)}")
        
        return news_items
    
    async def scrape_boe_news(self) -> List[Dict[str, Any]]:
        """Scrape news from BOE"""
        news_items = []
        try:
            # Search BOE for relevant topics
            search_terms = ["inteligencia artificial", "dispositivos médicos", "protección datos"]
            
            for term in search_terms:
                search_url = f"https://www.boe.es/buscar/doc.php?texto={term}"
                
                headers = {
                    'User-Agent': 'Mozilla/5.0 (compatible; ComplianceNewsBot/1.0)'
                }
                
                response = requests.get(search_url, headers=headers, timeout=30)
                if response.status_code != 200:
                    continue
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for recent documents
                results = soup.find_all('div', class_='resultado_busqueda')[:3]  # Top 3 per term
                
                for result in results:
                    try:
                        title_elem = result.find('h3')
                        if not title_elem:
                            continue
                        
                        link_elem = title_elem.find('a')
                        if not link_elem:
                            continue
                        
                        title = link_elem.get_text(strip=True)
                        link = urljoin("https://www.boe.es", link_elem.get('href', ''))
                        
                        # Get summary
                        summary_elem = result.find('p')
                        summary = summary_elem.get_text(strip=True)[:300] if summary_elem else ""
                        
                        news_items.append({
                            "title": title,
                            "url": link,
                            "summary": summary,
                            "source": "BOE",
                            "category": "regulation",
                            "search_term": term,
                            "language": "es"
                        })
                        
                    except Exception as e:
                        logger.warning(f"Error parsing BOE result: {str(e)}")
                        continue
            
            logger.info(f"Scraped {len(news_items)} items from BOE")
            
        except Exception as e:
            logger.error(f"Error scraping BOE: {str(e)}")
        
        return news_items
    
    async def generate_news_summary(self, news_item: Dict[str, Any]) -> str:
        """Generate AI summary for news item"""
        try:
            chat = LlmChat(
                api_key=self.emergent_key,
                session_id=f"news_summary_{hashlib.md5(news_item['url'].encode()).hexdigest()}",
                system_message="Eres un asistente especializado en resumir noticias normativas para startups de salud digital e insurtech. Crea resúmenes concisos y relevantes."
            ).with_model("openai", "gpt-5")
            
            prompt = f"""
Título: {news_item['title']}
Fuente: {news_item['source']}
Resumen original: {news_item.get('summary', 'No disponible')}

Genera un resumen de 2-3 frases que explique:
1. Qué normativa o regulación se trata
2. Cómo podría afectar a startups de salud digital e insurtech
3. Si es relevante para cumplimiento de IA, GDPR, dispositivos médicos, etc.

Responde en español y sé conciso pero informativo.
"""
            
            user_message = UserMessage(text=prompt)
            ai_summary = await chat.send_message(user_message)
            
            return ai_summary
            
        except Exception as e:
            logger.error(f"Error generating news summary: {str(e)}")
            return news_item.get('summary', 'Resumen no disponible')
    
    async def process_and_save_news(self, news_items: List[Dict[str, Any]]):
        """Process news items and save to database"""
        for item in news_items:
            try:
                # Generate unique ID based on URL
                item_id = hashlib.md5(item['url'].encode()).hexdigest()
                
                # Check if already exists
                existing = await self.db.news_items.find_one({"id": item_id})
                if existing:
                    continue
                
                # Generate AI summary
                ai_summary = await self.generate_news_summary(item)
                
                # Create news item
                news_item = {
                    "id": item_id,
                    "title": item['title'],
                    "url": item['url'],
                    "summary": item.get('summary', ''),
                    "ai_summary": ai_summary,
                    "source": item['source'],
                    "category": item.get('category', 'regulation'),
                    "language": item.get('language', 'es'),
                    "scraped_at": datetime.now(timezone.utc),
                    "relevance_score": self.calculate_relevance_score(item),
                    "tags": self.extract_tags(item)
                }
                
                await self.db.news_items.insert_one(news_item)
                logger.info(f"Saved news item: {item['title'][:50]}...")
                
            except Exception as e:
                logger.error(f"Error processing news item: {str(e)}")
    
    def calculate_relevance_score(self, item: Dict[str, Any]) -> float:
        """Calculate relevance score for news item"""
        score = 0.0
        title_lower = item['title'].lower()
        summary_lower = item.get('summary', '').lower()
        
        # High relevance keywords
        high_keywords = ['artificial intelligence', 'inteligencia artificial', 'ai act', 'gdpr', 'rgpd', 'medical device', 'dispositivo médico']
        for keyword in high_keywords:
            if keyword in title_lower or keyword in summary_lower:
                score += 3.0
        
        # Medium relevance keywords
        medium_keywords = ['regulation', 'regulación', 'compliance', 'cumplimiento', 'startup', 'innovation', 'innovación']
        for keyword in medium_keywords:
            if keyword in title_lower or keyword in summary_lower:
                score += 1.5
        
        # Source credibility
        if item['source'] in ['EUR-Lex', 'BOE']:
            score += 2.0
        
        return min(score, 10.0)  # Cap at 10
    
    def extract_tags(self, item: Dict[str, Any]) -> List[str]:
        """Extract relevant tags from news item"""
        tags = []
        text = f"{item['title']} {item.get('summary', '')}".lower()
        
        # Define tag mappings
        tag_keywords = {
            'ai': ['artificial intelligence', 'inteligencia artificial', 'machine learning', 'ai'],
            'gdpr': ['gdpr', 'rgpd', 'data protection', 'protección datos'],
            'medical': ['medical device', 'dispositivo médico', 'health', 'salud'],
            'insurance': ['insurance', 'seguros', 'insurtech'],
            'regulation': ['regulation', 'regulación', 'law', 'ley'],
            'eu': ['european union', 'unión europea', 'eu', 'ue'],
            'spain': ['spain', 'españa', 'spanish', 'español']
        }
        
        for tag, keywords in tag_keywords.items():
            if any(keyword in text for keyword in keywords):
                tags.append(tag)
        
        return tags
    
    async def collect_all_news(self):
        """Collect news from all sources"""
        logger.info("Starting news collection from all sources")
        
        all_news = []
        
        # Collect from EUR-Lex
        eur_lex_news = await self.scrape_eur_lex_news()
        all_news.extend(eur_lex_news)
        
        # Collect from BOE
        boe_news = await self.scrape_boe_news()
        all_news.extend(boe_news)
        
        # Process and save all news
        await self.process_and_save_news(all_news)
        
        logger.info(f"Completed news collection. Total items processed: {len(all_news)}")
    
    async def get_recent_news(self, limit: int = 20, category: Optional[str] = None, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent news items"""
        try:
            # Build query
            query = {
                "scraped_at": {
                    "$gte": datetime.now(timezone.utc) - timedelta(days=days)
                }
            }
            
            if category:
                query["category"] = category
            
            # Get news items and exclude MongoDB ObjectId field
            news = await self.db.news_items.find(
                query, 
                {"_id": 0}  # Exclude MongoDB ObjectId
            ).sort([
                ("relevance_score", -1),
                ("scraped_at", -1)
            ]).limit(limit).to_list(limit)
            
            return news
            
        except Exception as e:
            logger.error(f"Error getting recent news: {str(e)}")
            return []
    
    async def search_news(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search news items"""
        try:
            # Text search and exclude MongoDB ObjectId field
            search_results = await self.db.news_items.find(
                {"$text": {"$search": query}},
                {"_id": 0}  # Exclude MongoDB ObjectId
            ).sort([
                ("score", {"$meta": "textScore"}),
                ("relevance_score", -1)
            ]).limit(limit).to_list(limit)
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching news: {str(e)}")
            return []
    
    async def get_news_by_tags(self, tags: List[str], limit: int = 10) -> List[Dict[str, Any]]:
        """Get news items by tags"""
        try:
            news = await self.db.news_items.find(
                {"tags": {"$in": tags}},
                {"_id": 0}  # Exclude MongoDB ObjectId
            ).sort([
                ("relevance_score", -1),
                ("scraped_at", -1)
            ]).limit(limit).to_list(limit)
            
            return news
            
        except Exception as e:
            logger.error(f"Error getting news by tags: {str(e)}")
            return []

def schedule_news_updates():
    """Schedule weekly news updates"""
    schedule.every().week.do(lambda: asyncio.run(news_service.collect_all_news()))
    
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour

def start_news_scheduler():
    """Start news update scheduler"""
    scheduler_thread = Thread(target=schedule_news_updates, daemon=True)
    scheduler_thread.start()
    logger.info("News update scheduler started (weekly updates)")

# Initialize news service (will be set in server.py)
news_service = None