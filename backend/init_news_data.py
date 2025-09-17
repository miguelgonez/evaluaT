#!/usr/bin/env python3
"""
Script to initialize real news data from official sources
"""
import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import hashlib

# Add the backend directory to Python path
sys.path.append('/app/backend')
from news_service import NewsService

load_dotenv('/app/backend/.env')

async def init_real_news_data():
    """Initialize real news data from official sources"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        print("🗞️  Initializing real news data from official sources...")
        
        # Clear existing news
        await db.news_items.delete_many({})
        print("   Cleared existing news items")
        
        # Initialize news service
        news_service = NewsService(client)
        
        # Collect real news from official sources
        print("   📡 Collecting from EUR-Lex (EU official)...")
        print("   📡 Collecting from BOE (Spanish official)...")
        print("   📡 Collecting from AEMPS (Spanish medicines)...")
        
        await news_service.collect_all_news()
        
        # Create text indexes for search
        try:
            await db.news_items.create_index([("title", "text"), ("summary", "text"), ("ai_summary", "text")])
            print("   ✅ Created text search indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation note: {str(e)}")
        
        # Get count of real news items
        news_count = await db.news_items.count_documents({})
        print(f"🎉 Successfully collected {news_count} real news items from official sources!")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error collecting real news data: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(init_real_news_data())
    sys.exit(0 if success else 1)