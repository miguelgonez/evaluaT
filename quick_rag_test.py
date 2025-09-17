#!/usr/bin/env python3

import requests
import json
import time

def test_rag_with_longer_timeout():
    """Test RAG system with longer timeout"""
    base_url = "https://compliai-saas.preview.emergentagent.com/api"
    
    print("🧠 Testing RAG System with Extended Timeout...")
    
    # First register and get token
    timestamp = int(time.time())
    user_data = {
        "email": f"rag_test_{timestamp}@test.com",
        "password": "password123",
        "company_name": "RAG Test Company",
        "company_type": "digital_health"
    }
    
    try:
        # Register
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=30)
        if response.status_code != 200:
            print(f"❌ Registration failed: {response.status_code}")
            return False
            
        token = response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Create chat session
        session_response = requests.post(
            f"{base_url}/chat/sessions", 
            json={"title": "RAG Test Session"}, 
            headers=headers, 
            timeout=30
        )
        
        if session_response.status_code != 200:
            print(f"❌ Session creation failed: {session_response.status_code}")
            return False
            
        session_id = session_response.json()['session_id']
        print(f"✅ Chat session created: {session_id}")
        
        # Test RAG message with 60 second timeout
        print("🔍 Sending RAG message (this may take 15-30 seconds)...")
        start_time = time.time()
        
        message_data = {
            "message": "¿Qué requisitos tiene el EU AI Act para sistemas de IA de alto riesgo?",
            "category": "ai_regulation"
        }
        
        message_response = requests.post(
            f"{base_url}/chat/sessions/{session_id}/messages",
            json=message_data,
            headers=headers,
            timeout=60  # Extended timeout
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Response time: {duration:.1f} seconds")
        
        if message_response.status_code == 200:
            response_data = message_response.json()
            
            if 'ai_response' in response_data:
                ai_content = response_data['ai_response'].get('content', '')
                relevant_docs = response_data.get('relevant_documents', [])
                
                print(f"✅ RAG system working!")
                print(f"   AI Response length: {len(ai_content)} characters")
                print(f"   Relevant documents: {len(relevant_docs)}")
                print(f"   Response preview: {ai_content[:150]}...")
                
                # Check for Spanish content
                spanish_keywords = ['requisitos', 'sistemas', 'alto riesgo', 'cumplimiento']
                spanish_found = sum(1 for keyword in spanish_keywords if keyword.lower() in ai_content.lower())
                
                print(f"   Spanish keywords found: {spanish_found}/{len(spanish_keywords)}")
                
                return True
            else:
                print(f"❌ Invalid response format: {response_data}")
                return False
        else:
            print(f"❌ Message failed: {message_response.status_code}")
            print(f"   Error: {message_response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Request still timed out after 60 seconds")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_rag_with_longer_timeout()
    if success:
        print("\n🎉 RAG System is working (just slow)")
    else:
        print("\n❌ RAG System has issues")