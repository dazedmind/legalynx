import os

# Security Configuration
class SecurityConfig:
    # Rate limits (per hour)
    UPLOAD_LIMIT = 10
    QUERY_LIMIT = 100
    
    # Content detection sensitivity
    MALICIOUS_PATTERN_THRESHOLD = 2
    
    # Enable/disable features
    ENABLE_CONTENT_DETECTION = True
    ENABLE_RATE_LIMITING = True
    ENABLE_INJECTION_PROTECTION = True
    ENABLE_INTEGRITY_CHECK = True
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET')
    JWT_ALGORITHM = 'HS256'