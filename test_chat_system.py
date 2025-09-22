#!/usr/bin/env python3

import requests
import json
import time

def test_chat_system():
    """Test chat system functionality"""
    base_url = "https://medregs-wizard.preview.emergentagent.com/api"
    
    print("💬 Testing Chat System...")
    
    # First register and get token
    user_data = {
        "email": f"chat_test_{int(time.time())}@test.com",
        "password": "password123",
        "company_name": "Chat Test Company",
        "company_type": "digital_health"
    }
    
    try:
        print("\n1. Registering user for chat test...")
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=30)
        if response.status_code != 200:
            print(f"   ❌ Registration failed: {response.status_code}")
            return False
        
        token = response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        print("   ✅ User registered successfully")
        
        # Create chat session
        print("\n2. Creating chat session...")
        session_data = {"title": "Test RAG Session"}
        response = requests.post(f"{base_url}/chat/sessions", json=session_data, headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            session_id = response.json().get('session_id')
            print(f"   ✅ Chat session created: {session_id}")
            
            # Get chat sessions
            print("\n3. Getting chat sessions...")
            response = requests.get(f"{base_url}/chat/sessions", headers=headers, timeout=30)
            if response.status_code == 200:
                sessions = response.json().get('sessions', [])
                print(f"   ✅ Found {len(sessions)} sessions")
            
            # Try to send a simple message (this might fail due to budget)
            print("\n4. Testing chat message (may fail due to budget)...")
            message_data = {
                "message": "¿Qué es el EU AI Act?",
                "category": "ai_regulation"
            }
            
            try:
                response = requests.post(
                    f"{base_url}/chat/sessions/{session_id}/messages", 
                    json=message_data, 
                    headers=headers, 
                    timeout=60  # Longer timeout for AI response
                )
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if 'ai_response' in data:
                        ai_content = data['ai_response'].get('content', '')
                        print(f"   ✅ Chat message successful!")
                        print(f"   AI Response length: {len(ai_content)} characters")
                        print(f"   Preview: {ai_content[:100]}...")
                        return True
                    else:
                        print("   ❌ No AI response in data")
                        return False
                else:
                    error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                    print(f"   ❌ Chat message failed: {error_data}")
                    return False
                    
            except requests.exceptions.Timeout:
                print("   ⚠️  Chat message timed out (likely due to AI processing)")
                return False
            except Exception as e:
                print(f"   ❌ Chat message error: {str(e)}")
                return False
        else:
            print(f"   ❌ Chat session creation failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Chat system test error: {str(e)}")
        return False

def test_document_search():
    """Test document search without requiring embeddings"""
    base_url = "https://medregs-wizard.preview.emergentagent.com/api"
    
    print("\n📚 Testing Document Search...")
    
    try:
        # Test document search
        print("\n1. Testing document search...")
        response = requests.get(f"{base_url}/documents/search?query=artificial%20intelligence&k=3", timeout=30)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            print(f"   ✅ Document search working")
            print(f"   Results found: {len(results)}")
            
            if results:
                print(f"   Sample result: {results[0].get('content', '')[:100]}...")
            else:
                print("   ⚠️  No results (expected if embeddings not working)")
            return True
        else:
            print(f"   ❌ Document search failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Document search error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Chat and Document Systems")
    print("=" * 50)
    
    chat_working = test_chat_system()
    doc_working = test_document_search()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Chat System: {'✅ Working' if chat_working else '❌ Issues'}")
    print(f"Document Search: {'✅ Working' if doc_working else '❌ Issues'}")
    
    if not chat_working and not doc_working:
        print("\n⚠️  RAG system has significant issues")
    elif chat_working or doc_working:
        print("\n✅ RAG system partially working")
    else:
        print("\n🎉 RAG system fully working!")