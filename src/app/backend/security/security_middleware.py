# Simplified Security Implementation

import re
import hashlib
import time
from typing import Dict, List, Optional, Any
from collections import defaultdict
from fastapi import HTTPException, Request
import jwt
import os

# 1. Simplified Content Anomaly Detection
class SimpleContentDetector:
    def __init__(self):
        self.malicious_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'eval\s*\(',
            r'exec\s*\(',
            r'__import__',
            r'subprocess'
        ]
        self.risk_threshold = 2

    def is_malicious(self, content: str) -> bool:
        """Simple boolean check for malicious content"""
        risk_score = 0
        for pattern in self.malicious_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                risk_score += 1
                if risk_score >= self.risk_threshold:
                    return True
        return False

# 2. Simple Rate Limiter (In-Memory)
class SimpleRateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.limits = {
            'upload': 10,   # 10 uploads per hour
            'query': 100    # 100 queries per hour
        }
    
    def check_limit(self, user_id: str, action_type: str) -> bool:
        """Returns True if request is allowed, False if rate limited"""
        current_time = time.time()
        time_window = 3600  # 1 hour
        
        # Clean old requests
        self.requests[f"{user_id}_{action_type}"] = [
            req_time for req_time in self.requests[f"{user_id}_{action_type}"]
            if current_time - req_time <= time_window
        ]
        
        # Check limit
        request_count = len(self.requests[f"{user_id}_{action_type}"])
        limit = self.limits.get(action_type, 50)
        
        if request_count >= limit:
            return False
        
        # Record request
        self.requests[f"{user_id}_{action_type}"].append(current_time)
        return True

# 3. Simple Prompt Injection Detector
class SimpleInjectionDetector:
    def __init__(self):
        self.injection_patterns = [
            r'ignore\s+(previous\s+)?instructions',
            r'system\s*:\s*',
            r'you\s+are\s+now\s+',
            r'pretend\s+to\s+be',
            r'override\s+system'
        ]
    
    def sanitize_query(self, query: str) -> str:
        """Clean potentially malicious queries"""
        sanitized = query
        
        # Remove injection patterns
        for pattern in self.injection_patterns:
            sanitized = re.sub(pattern, '[REMOVED]', sanitized, flags=re.IGNORECASE)
        
        return sanitized.strip()
    
    def has_injection(self, query: str) -> bool:
        """Check if query contains injection attempts"""
        for pattern in self.injection_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return True
        return False

# 4. Document Integrity Checker
class SimpleIntegrityChecker:
    def __init__(self):
        self.stored_hashes = {}
    
    def calculate_hash(self, file_path: str) -> str:
        """Calculate SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    def verify_integrity(self, document_id: str, file_path: str) -> bool:
        """Verify document integrity"""
        current_hash = self.calculate_hash(file_path)
        
        if document_id not in self.stored_hashes:
            # First time, store hash
            self.stored_hashes[document_id] = current_hash
            return True
        
        # Compare with stored hash
        return current_hash == self.stored_hashes[document_id]

# 5. Combined Security Middleware
class SimplifiedSecurityMiddleware:
    def __init__(self):
        self.content_detector = SimpleContentDetector()
        self.rate_limiter = SimpleRateLimiter()
        self.injection_detector = SimpleInjectionDetector()
        self.integrity_checker = SimpleIntegrityChecker()
    
    def check_upload_security(self, user_id: str, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """Check upload security without logging"""
        # Rate limit check
        if not self.rate_limiter.check_limit(user_id, 'upload'):
            raise HTTPException(status_code=429, detail="Upload rate limit exceeded")
        
        # Content check
        content_str = file_content.decode('utf-8', errors='ignore')[:10000]  # First 10KB
        if self.content_detector.is_malicious(content_str):
            raise HTTPException(status_code=400, detail="Malicious content detected")
        
        # Integrity check
        doc_id = f"{user_id}_{int(time.time())}"
        if not self.integrity_checker.verify_integrity(doc_id, file_path):
            raise HTTPException(status_code=400, detail="Document integrity check failed")
        
        return {"status": "approved", "document_id": doc_id}
    
    def check_query_security(self, user_id: str, query: str) -> str:
        """Check query security and return sanitized query"""
        # Rate limit check
        if not self.rate_limiter.check_limit(user_id, 'query'):
            raise HTTPException(status_code=429, detail="Query rate limit exceeded")
        
        # Injection detection and sanitization
        if self.injection_detector.has_injection(query):
            return self.injection_detector.sanitize_query(query)
        
        return query