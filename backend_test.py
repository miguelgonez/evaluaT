import requests
import sys
import json
from datetime import datetime

class AIComplianceAPITester:
    def __init__(self, base_url="https://insurtech-ai-eval.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.assessment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Expected {expected_status}, got {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_register_digital_health(self):
        """Test user registration for digital health company"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_health_{timestamp}@healthtech.com",
            "password": "password123",
            "company_name": "HealthTech AI",
            "company_type": "digital_health"
        }
        
        success, response = self.run_test(
            "Register Digital Health User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_register_insurtech(self):
        """Test user registration for insurtech company"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_insurtech_{timestamp}@insurtech.com",
            "password": "password123",
            "company_name": "InsurTech Pro",
            "company_type": "insurtech"
        }
        
        success, response = self.run_test(
            "Register Insurtech User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        return success

    def test_login(self):
        """Test user login"""
        if not self.user_data:
            print("❌ No user data available for login test")
            return False
            
        login_data = {
            "email": self.user_data.get('email'),
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Login successful, token: {self.token[:20]}...")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            expected_keys = ['total_assessments', 'latest_risk_score', 'compliance_status', 'recommendations_count']
            for key in expected_keys:
                if key not in response:
                    print(f"❌ Missing key in dashboard stats: {key}")
                    return False
            print(f"   Dashboard stats complete with all required keys")
        
        return success

    def test_get_assessments_empty(self):
        """Test getting assessments when none exist"""
        success, response = self.run_test(
            "Get Assessments (Empty)",
            "GET",
            "assessments",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} assessments")
            return True
        return False

    def test_create_high_risk_assessment(self):
        """Test creating a high-risk assessment with Spanish recommendations"""
        high_risk_responses = {
            "company_description": "medical_diagnosis",
            "medical_diagnosis": "yes",
            "automated_decision_making": "yes",
            "biometric_identification": "yes",
            "emotion_recognition": "yes",
            "data_processing": "sensitive",
            "transparency": "none",
            "human_oversight": "none"
        }
        
        success, response = self.run_test(
            "Create High Risk Assessment (Spanish)",
            "POST",
            "assessments",
            200,
            data={"responses": high_risk_responses}
        )
        
        if success:
            self.assessment_id = response.get('id')
            risk_score = response.get('risk_score', 0)
            risk_level = response.get('risk_level', '')
            compliance_status = response.get('compliance_status', '')
            recommendations = response.get('recommendations', [])
            
            print(f"   Assessment ID: {self.assessment_id}")
            print(f"   Risk Score: {risk_score}")
            print(f"   Risk Level: {risk_level}")
            print(f"   Compliance Status: {compliance_status}")
            print(f"   Recommendations Count: {len(recommendations)}")
            
            # Check if recommendations are in Spanish
            spanish_keywords = ['Acción', 'inmediata', 'requerida', 'Implementar', 'Asegurar', 'sistema', 'gestión', 'validación clínica', 'GDPR']
            spanish_recommendations = [rec for rec in recommendations if any(keyword in rec for keyword in spanish_keywords)]
            
            print(f"   Spanish Recommendations Found: {len(spanish_recommendations)}")
            if spanish_recommendations:
                print(f"   Sample Spanish Recommendations:")
                for i, rec in enumerate(spanish_recommendations[:3]):
                    print(f"     {i+1}. {rec}")
            
            # Verify high risk assessment results AND Spanish recommendations
            risk_correct = risk_score >= 6.0 and risk_level in ['high', 'unacceptable']
            spanish_correct = len(spanish_recommendations) > 0
            
            if risk_correct and spanish_correct:
                print(f"✅ High risk assessment correctly classified with Spanish recommendations")
                return True
            else:
                if not risk_correct:
                    print(f"❌ High risk assessment not properly classified")
                if not spanish_correct:
                    print(f"❌ No Spanish recommendations found")
                return False
        
        return False

    def test_create_low_risk_assessment(self):
        """Test creating a low-risk assessment with Spanish recommendations"""
        low_risk_responses = {
            "company_description": "other",
            "medical_diagnosis": "no",
            "automated_decision_making": "no",
            "biometric_identification": "no",
            "emotion_recognition": "no",
            "data_processing": "anonymous",
            "transparency": "full",
            "human_oversight": "continuous"
        }
        
        success, response = self.run_test(
            "Create Low Risk Assessment (Spanish)",
            "POST",
            "assessments",
            200,
            data={"responses": low_risk_responses}
        )
        
        if success:
            risk_score = response.get('risk_score', 0)
            risk_level = response.get('risk_level', '')
            compliance_status = response.get('compliance_status', '')
            recommendations = response.get('recommendations', [])
            
            print(f"   Risk Score: {risk_score}")
            print(f"   Risk Level: {risk_level}")
            print(f"   Compliance Status: {compliance_status}")
            print(f"   Recommendations Count: {len(recommendations)}")
            
            # Check if recommendations are in Spanish
            spanish_keywords = ['Mantener', 'monitoreo', 'continuo', 'Establecer', 'proceso', 'revisión', 'periódica']
            spanish_recommendations = [rec for rec in recommendations if any(keyword in rec for keyword in spanish_keywords)]
            
            print(f"   Spanish Recommendations Found: {len(spanish_recommendations)}")
            if spanish_recommendations:
                print(f"   Sample Spanish Recommendations:")
                for i, rec in enumerate(spanish_recommendations[:3]):
                    print(f"     {i+1}. {rec}")
            
            # Verify low risk assessment results AND Spanish recommendations
            risk_correct = risk_score <= 3.0 and risk_level in ['minimal', 'limited']
            spanish_correct = len(spanish_recommendations) > 0
            
            if risk_correct and spanish_correct:
                print(f"✅ Low risk assessment correctly classified with Spanish recommendations")
                return True
            else:
                if not risk_correct:
                    print(f"❌ Low risk assessment not properly classified")
                if not spanish_correct:
                    print(f"❌ No Spanish recommendations found")
                return False
        
        return False

    def test_get_specific_assessment(self):
        """Test getting a specific assessment by ID"""
        if not self.assessment_id:
            print("❌ No assessment ID available for test")
            return False
            
        success, response = self.run_test(
            "Get Specific Assessment",
            "GET",
            f"assessments/{self.assessment_id}",
            200
        )
        
        if success:
            required_fields = ['id', 'risk_score', 'risk_level', 'compliance_status', 'recommendations']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in assessment: {field}")
                    return False
            print(f"✅ Assessment contains all required fields")
        
        return success

    def test_generate_report(self):
        """Test report generation"""
        if not self.assessment_id:
            print("❌ No assessment ID available for report generation")
            return False
            
        success, response = self.run_test(
            "Generate Report",
            "POST",
            f"reports/generate/{self.assessment_id}",
            200
        )
        
        if success:
            if 'report_id' in response and 'report_data' in response:
                print(f"✅ Report generated successfully")
                return True
            else:
                print(f"❌ Report response missing required fields")
                return False
        
        return False
    def test_medical_diagnosis_spanish(self):
        """Test medical diagnosis specific Spanish recommendations"""
        medical_responses = {
            "company_description": "medical_diagnosis",
            "medical_diagnosis": "yes",
            "automated_decision_making": "partial",
            "biometric_identification": "no",
            "emotion_recognition": "no",
            "data_processing": "sensitive",
            "transparency": "partial",
            "human_oversight": "periodic"
        }
        
        success, response = self.run_test(
            "Medical Diagnosis Assessment (Spanish)",
            "POST",
            "assessments",
            200,
            data={"responses": medical_responses}
        )
        
        if success:
            recommendations = response.get('recommendations', [])
            
            # Check for medical-specific Spanish recommendations
            medical_keywords = ['validación clínica', 'dispositivos médicos', 'autoridades sanitarias', 'validación clínica continua']
            medical_recommendations = [rec for rec in recommendations if any(keyword in rec for keyword in medical_keywords)]
            
            print(f"   Total Recommendations: {len(recommendations)}")
            print(f"   Medical-specific Spanish Recommendations: {len(medical_recommendations)}")
            
            if medical_recommendations:
                print(f"   Medical Spanish Recommendations Found:")
                for i, rec in enumerate(medical_recommendations):
                    print(f"     {i+1}. {rec}")
                return True
            else:
                print(f"❌ No medical-specific Spanish recommendations found")
                print(f"   All recommendations:")
                for i, rec in enumerate(recommendations):
                    print(f"     {i+1}. {rec}")
                return False
        
        return False

    def test_sensitive_data_spanish(self):
        """Test sensitive data processing Spanish recommendations"""
        sensitive_data_responses = {
            "company_description": "insurance_risk_assessment",
            "medical_diagnosis": "no",
            "automated_decision_making": "yes",
            "biometric_identification": "no",
            "emotion_recognition": "no",
            "data_processing": "sensitive",
            "transparency": "minimal",
            "human_oversight": "exception"
        }
        
        success, response = self.run_test(
            "Sensitive Data Assessment (Spanish)",
            "POST",
            "assessments",
            200,
            data={"responses": sensitive_data_responses}
        )
        
        if success:
            recommendations = response.get('recommendations', [])
            
            # Check for GDPR and data-specific Spanish recommendations
            data_keywords = ['GDPR', 'datos personales', 'minimización de datos', 'cumplimiento del GDPR']
            data_recommendations = [rec for rec in recommendations if any(keyword in rec for keyword in data_keywords)]
            
            print(f"   Total Recommendations: {len(recommendations)}")
            print(f"   Data-specific Spanish Recommendations: {len(data_recommendations)}")
            
            if data_recommendations:
                print(f"   Data Spanish Recommendations Found:")
                for i, rec in enumerate(data_recommendations):
                    print(f"     {i+1}. {rec}")
                return True
            else:
                print(f"❌ No data-specific Spanish recommendations found")
                print(f"   All recommendations:")
                for i, rec in enumerate(recommendations):
                    print(f"     {i+1}. {rec}")
                return False
        
        return False

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        # Test invalid assessment ID
        success, _ = self.run_test(
            "Invalid Assessment ID",
            "GET",
            "assessments/invalid-id",
            404
        )
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting AI Compliance API Tests")
        print("=" * 50)
        
        # Basic endpoint tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Authentication tests
        if not self.test_register_digital_health():
            print("❌ Registration failed, stopping tests")
            return False
            
        self.test_register_insurtech()  # Test second registration type
        
        if not self.test_login():
            print("❌ Login failed, stopping tests")
            return False
        
        # Dashboard and assessment tests (require authentication)
        self.test_dashboard_stats()
        self.test_get_assessments_empty()
        
        # Assessment creation and retrieval
        if not self.test_create_high_risk_assessment():
            print("❌ High risk assessment creation failed")
            
        self.test_create_low_risk_assessment()
        self.test_medical_diagnosis_spanish()
        self.test_sensitive_data_spanish()
        self.test_get_specific_assessment()
        self.test_generate_report()
        
        # Error handling tests
        self.test_invalid_endpoints()
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 TEST RESULTS")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} TESTS FAILED")
            return False

def main():
    tester = AIComplianceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())