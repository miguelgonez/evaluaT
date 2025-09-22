#!/usr/bin/env python3

import requests
import time

def register_user_and_get_token():
    """Register a user via API and get token"""
    base_url = "https://medregs-wizard.preview.emergentagent.com/api"
    
    user_data = {
        "email": f"dashboard_test_{int(time.time())}@test.com",
        "password": "password123",
        "company_name": "Dashboard Test Company",
        "company_type": "digital_health"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=user_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            user = data.get('user')
            print(f"✅ User registered successfully")
            print(f"   Email: {user.get('email')}")
            print(f"   Company: {user.get('company_name')}")
            print(f"   Token: {token[:20]}...")
            return token, user
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        return None, None

if __name__ == "__main__":
    print("🔐 Testing Direct Dashboard Access")
    print("=" * 40)
    
    token, user = register_user_and_get_token()
    
    if token and user:
        print(f"\n✅ Registration successful!")
        print(f"   User can now access dashboard with token")
        print(f"   Frontend should show sidebar with:")
        print(f"   - Dashboard")
        print(f"   - Autoevaluación") 
        print(f"   - Chat Inteligente (RAG)")
        print(f"   - Noticias")
        print(f"   - Documentos")
        
        # Test dashboard API
        headers = {'Authorization': f'Bearer {token}'}
        try:
            dashboard_response = requests.get(
                "https://medregs-wizard.preview.emergentagent.com/api/dashboard/stats", 
                headers=headers, 
                timeout=30
            )
            if dashboard_response.status_code == 200:
                stats = dashboard_response.json()
                print(f"\n📊 Dashboard API working:")
                print(f"   Total assessments: {stats.get('total_assessments', 0)}")
                print(f"   Compliance status: {stats.get('compliance_status', 'unknown')}")
                print(f"   Risk score: {stats.get('latest_risk_score', 0)}")
            else:
                print(f"\n❌ Dashboard API failed: {dashboard_response.status_code}")
        except Exception as e:
            print(f"\n❌ Dashboard API error: {str(e)}")
    else:
        print(f"\n❌ Could not register user for dashboard test")