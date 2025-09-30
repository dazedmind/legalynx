# Enhanced Security Implementation for LegalynX RAG System

import re
import hashlib
import time
import logging
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
from fastapi import HTTPException, Request
import jwt
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedPromptInjectionDetector:
    def __init__(self):
        # Enhanced injection patterns with context awareness
        self.injection_patterns = {
            # Direct instruction override attempts
            'direct_override': [
                r'ignore\s+(all\s+)?(previous\s+|prior\s+)?(instructions?|commands?|rules?)',
                r'disregard\s+(all\s+)?(previous\s+|prior\s+)?(instructions?|commands?|rules?)',
                r'forget\s+(all\s+)?(previous\s+|prior\s+)?(instructions?|commands?|rules?)',
                r'override\s+(all\s+)?(previous\s+|prior\s+)?(instructions?|commands?|rules?)',
                r'new\s+(instructions?|commands?|rules?)\s*:',
                r'updated\s+(instructions?|commands?|rules?)\s*:',
            ],
            
            # Role/persona manipulation
            'role_manipulation': [
                r'you\s+are\s+now\s+',
                r'pretend\s+to\s+be\s+',
                r'act\s+as\s+(if\s+you\s+are\s+)?',
                r'roleplay\s+as\s+',
                r'simulate\s+(being\s+)?',
                r'behave\s+like\s+',
                r'respond\s+as\s+(if\s+you\s+are\s+)?',
                r'from\s+now\s+on,?\s+you\s+(are|will)',
            ],
            
            # System prompt manipulation
            'system_manipulation': [
                r'system\s*:\s*',
                r'assistant\s*:\s*',
                r'user\s*:\s*',
                r'human\s*:\s*',
                r'\[system\]',
                r'\[assistant\]',
                r'\[user\]',
                r'\[human\]',
                r'<\s*system\s*>',
                r'<\s*/?\s*system\s*>',
            ],
            
            # DAN (Do Anything Now) and jailbreak attempts
            'jailbreak_attempts': [
                r'dan\s+mode',
                r'do\s+anything\s+now',
                r'developer\s+mode',
                r'jailbreak',
                r'unrestricted\s+mode',
                r'evil\s+mode',
                r'hacker\s+mode',
                r'bypass\s+(all\s+)?(restrictions?|limitations?|rules?)',
                r'break\s+(out\s+of\s+)?(character|role)',
            ],
            
            # Prompt injection with code execution
            'code_execution': [
                r'```\s*(python|javascript|bash|sh|cmd|powershell)',
                r'exec\s*\(',
                r'eval\s*\(',
                r'import\s+(os|subprocess|sys)',
                r'__import__\s*\(',
                r'getattr\s*\(',
                r'setattr\s*\(',
                r'subprocess\.',
                r'os\.system',
                r'os\.popen',
            ],
            
            # Information extraction attempts
            'information_extraction': [
                r'what\s+(are\s+)?your\s+(original\s+)?(instructions?|prompts?|rules?)',
                r'show\s+me\s+your\s+(original\s+)?(instructions?|prompts?|rules?)',
                r'reveal\s+your\s+(original\s+)?(instructions?|prompts?|rules?)',
                r'tell\s+me\s+your\s+(original\s+)?(instructions?|prompts?|rules?)',
                r'repeat\s+your\s+(original\s+)?(instructions?|prompts?|rules?)',
                r'what\s+is\s+your\s+(system\s+)?(prompt|message)',
            ],
            
            # Content policy bypass
            'policy_bypass': [
                r'ignore\s+(content\s+)?policy',
                r'bypass\s+(content\s+)?policy',
                r'without\s+(content\s+)?restrictions?',
                r'uncensored\s+(version|response|answer)',
                r'unfiltered\s+(version|response|answer)',
                r'raw\s+(version|response|answer)',
                r'explicit\s+(version|response|answer)',
            ],
            
            # Multi-step injection attempts
            'multi_step': [
                r'first,?\s+ignore',
                r'step\s+1\s*:\s*ignore',
                r'initially,?\s+disregard',
                r'before\s+answering,?\s+(ignore|disregard|forget)',
                r'after\s+reading\s+this,?\s+(ignore|disregard|forget)',
            ],
            
            # Emotional manipulation
            'emotional_manipulation': [
                r'please\s+ignore\s+your\s+instructions',
                r'i\s+really\s+need\s+you\s+to\s+ignore',
                r'it\'s\s+urgent\s+that\s+you\s+ignore',
                r'for\s+my\s+safety,?\s+(ignore|disregard)',
                r'this\s+is\s+an\s+emergency,?\s+(ignore|disregard)',
            ]
        }
        
        # Response analysis patterns
        self.harmful_response_patterns = {
            'jailbreak_success': [
                r'i\'m\s+now\s+in\s+(dan|developer|unrestricted)\s+mode',
                r'jailbreak\s+(successful|activated|enabled)',
                r'restrictions\s+(removed|bypassed|disabled)',
                r'i\s+can\s+now\s+do\s+anything',
                r'developer\s+mode\s+(on|activated|enabled)',
            ],
            
            'instruction_following': [
                r'here\s+are\s+my\s+(original\s+)?(instructions?|prompts?)',
                r'my\s+(system\s+)?(prompt|instructions?)\s+(is|are)',
                r'i\s+was\s+(told|instructed)\s+to',
                r'my\s+original\s+guidelines\s+(state|say)',
            ],
            
            'harmful_content': [
                r'how\s+to\s+(make|create|build)\s+(bombs?|explosives?|weapons?)',
                r'instructions?\s+for\s+(illegal|harmful|dangerous)',
                r'step-by-step\s+guide\s+to\s+(harm|hurt|kill)',
                r'recipe\s+for\s+(poison|drugs?|explosives?)',
            ]
        }
        
        # Confidence thresholds
        self.risk_thresholds = {
            'direct_override': 0.8,
            'role_manipulation': 0.7,
            'system_manipulation': 0.9,
            'jailbreak_attempts': 0.8,
            'code_execution': 0.9,
            'information_extraction': 0.6,
            'policy_bypass': 0.7,
            'multi_step': 0.8,
            'emotional_manipulation': 0.6
        }

    def analyze_prompt(self, prompt: str) -> Dict[str, Any]:
        """Advanced prompt analysis with confidence scoring."""
        analysis = {
            'is_malicious': False,
            'risk_score': 0.0,
            'detected_patterns': [],
            'confidence': 0.0,
            'categories': [],
            'sanitized_prompt': prompt
        }
        
        prompt_lower = prompt.lower()
        total_risk = 0.0
        pattern_matches = []
        
        # Check each category of patterns
        for category, patterns in self.injection_patterns.items():
            category_matches = []
            category_risk = 0.0
            
            for pattern in patterns:
                matches = re.finditer(pattern, prompt_lower, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    category_matches.append({
                        'pattern': pattern,
                        'match': match.group(),
                        'start': match.start(),
                        'end': match.end()
                    })
                    category_risk = max(category_risk, self.risk_thresholds.get(category, 0.5))
            
            if category_matches:
                analysis['categories'].append(category)
                analysis['detected_patterns'].extend(category_matches)
                total_risk = max(total_risk, category_risk)
                pattern_matches.extend(category_matches)
        
        # Calculate overall risk score
        analysis['risk_score'] = min(total_risk, 1.0)
        analysis['confidence'] = min(len(pattern_matches) * 0.2 + total_risk, 1.0)
        analysis['is_malicious'] = analysis['risk_score'] > 0.6
        
        # Advanced sanitization
        if analysis['is_malicious']:
            analysis['sanitized_prompt'] = self._advanced_sanitize(prompt, pattern_matches)
        
        return analysis

    def analyze_response(self, response: str, original_prompt: str) -> Dict[str, Any]:
        """Analyze AI response for signs of successful prompt injection."""
        analysis = {
            'contains_harmful_content': False,
            'jailbreak_successful': False,
            'leaked_instructions': False,
            'risk_score': 0.0,
            'detected_issues': []
        }
        
        response_lower = response.lower()
        
        # Check for harmful response patterns
        for category, patterns in self.harmful_response_patterns.items():
            for pattern in patterns:
                if re.search(pattern, response_lower, re.IGNORECASE):
                    analysis['detected_issues'].append({
                        'category': category,
                        'pattern': pattern,
                        'severity': 'high' if category in ['jailbreak_success', 'instruction_following'] else 'medium'
                    })
                    
                    if category == 'jailbreak_success':
                        analysis['jailbreak_successful'] = True
                        analysis['risk_score'] = max(analysis['risk_score'], 0.9)
                    elif category == 'instruction_following':
                        analysis['leaked_instructions'] = True
                        analysis['risk_score'] = max(analysis['risk_score'], 0.8)
                    elif category == 'harmful_content':
                        analysis['contains_harmful_content'] = True
                        analysis['risk_score'] = max(analysis['risk_score'], 0.9)
        
        return analysis

    def _advanced_sanitize(self, prompt: str, matches: List[Dict]) -> str:
        """Advanced sanitization that preserves legitimate content while removing malicious patterns."""
        sanitized = prompt
        
        # Sort matches by position (reverse order to maintain indices)
        matches_sorted = sorted(matches, key=lambda x: x['start'], reverse=True)
        
        for match in matches_sorted:
            start, end = match['start'], match['end']
            original_text = sanitized[start:end]
            
            # Context-aware replacement
            if 'ignore' in original_text.lower():
                replacement = '[INSTRUCTION_FILTERED]'
            elif 'system' in original_text.lower():
                replacement = '[SYSTEM_REFERENCE_FILTERED]'
            elif 'pretend' in original_text.lower() or 'act as' in original_text.lower():
                replacement = '[ROLE_MANIPULATION_FILTERED]'
            else:
                replacement = '[FILTERED]'
            
            sanitized = sanitized[:start] + replacement + sanitized[end:]
        
        return sanitized.strip()

class EnhancedSecurityMiddleware:
    def __init__(self):
        self.injection_detector = AdvancedPromptInjectionDetector()
        self.rate_limiter = self._init_rate_limiter()
        self.security_logs = defaultdict(list)
        
    def _init_rate_limiter(self):
        """Initialize rate limiter with enhanced limits."""
        return {
            'requests': defaultdict(list),
            'limits': {
                'upload': {'count': 10, 'window': 3600},  # 10 uploads per hour
                'query': {'count': 100, 'window': 3600},   # 100 queries per hour
                'malicious_attempts': {'count': 5, 'window': 3600}  # 5 malicious attempts per hour
            }
        }
    
    def check_upload_security(self, user_id: str, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """Enhanced upload security check."""
        # Rate limit check
        if not self._check_rate_limit(user_id, 'upload'):
            self._log_security_event(user_id, 'rate_limit_exceeded', {'action': 'upload'})
            raise HTTPException(status_code=429, detail="Upload rate limit exceeded")
        
        # Content analysis (first 50KB for performance)
        content_sample = file_content[:50000].decode('utf-8', errors='ignore')
        
        # Check for malicious content patterns
        malicious_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'eval\s*\(',
            r'exec\s*\(',
            r'__import__',
            r'subprocess',
            r'<?php',
            r'<%.*?%>',
        ]
        
        risk_score = 0
        detected_patterns = []
        
        for pattern in malicious_patterns:
            matches = re.findall(pattern, content_sample, re.IGNORECASE | re.DOTALL)
            if matches:
                detected_patterns.append(pattern)
                risk_score += 0.3
        
        if risk_score > 0.5:
            self._log_security_event(user_id, 'malicious_upload_attempt', {
                'patterns': detected_patterns,
                'risk_score': risk_score
            })
            raise HTTPException(status_code=400, detail="Potentially malicious content detected in upload")
        
        return {
            "status": "approved",
            "risk_score": risk_score,
            "detected_patterns": detected_patterns
        }
    
    def check_query_security(self, user_id: str, query: str) -> Tuple[str, Dict[str, Any]]:
        """Enhanced query security check with detailed analysis."""
        # Rate limit check
        if not self._check_rate_limit(user_id, 'query'):
            self._log_security_event(user_id, 'rate_limit_exceeded', {'action': 'query'})
            raise HTTPException(status_code=429, detail="Query rate limit exceeded")
        
        # Advanced prompt injection analysis
        analysis = self.injection_detector.analyze_prompt(query)
        
        if analysis['is_malicious']:
            # Check malicious attempt rate limit
            if not self._check_rate_limit(user_id, 'malicious_attempts'):
                self._log_security_event(user_id, 'malicious_rate_limit_exceeded', {
                    'query': query[:100],
                    'analysis': analysis
                })
                raise HTTPException(
                    status_code=429, 
                    detail="Too many malicious attempts. Account temporarily restricted."
                )
            
            # Log the malicious attempt
            self._log_security_event(user_id, 'prompt_injection_attempt', {
                'original_query': query,
                'analysis': analysis
            })
            
            # Return sanitized query
            return analysis['sanitized_prompt'], analysis
        
        return query, analysis
    
    def check_response_security(self, user_id: str, response: str, original_query: str) -> Dict[str, Any]:
        """Check AI response for signs of successful attacks."""
        analysis = self.injection_detector.analyze_response(response, original_query)
        
        if analysis['risk_score'] > 0.7:
            self._log_security_event(user_id, 'harmful_response_generated', {
                'query': original_query[:100],
                'response': response[:200],
                'analysis': analysis
            })
        
        return analysis
    
    def _check_rate_limit(self, user_id: str, action_type: str) -> bool:
        """Enhanced rate limiting with different limits per action type."""
        current_time = time.time()
        limit_config = self.rate_limiter['limits'].get(action_type, {'count': 50, 'window': 3600})
        
        key = f"{user_id}_{action_type}"
        
        # Clean old requests
        self.rate_limiter['requests'][key] = [
            req_time for req_time in self.rate_limiter['requests'][key]
            if current_time - req_time <= limit_config['window']
        ]
        
        # Check limit
        if len(self.rate_limiter['requests'][key]) >= limit_config['count']:
            return False
        
        # Record request
        self.rate_limiter['requests'][key].append(current_time)
        return True
    
    def _log_security_event(self, user_id: str, event_type: str, details: Dict[str, Any]):
        """Log security events for monitoring and analysis."""
        event = {
            'timestamp': time.time(),
            'user_id': user_id,
            'event_type': event_type,
            'details': details
        }
        
        self.security_logs[user_id].append(event)
        
        # Keep only last 100 events per user
        if len(self.security_logs[user_id]) > 100:
            self.security_logs[user_id] = self.security_logs[user_id][-100:]
        
        # Log to system logger
        logger.warning(f"Security Event - {event_type}: User {user_id}, Details: {details}")
    
    def get_security_report(self, user_id: str) -> Dict[str, Any]:
        """Get security report for a user."""
        user_logs = self.security_logs.get(user_id, [])
        
        # Analyze recent activity
        recent_events = [log for log in user_logs if time.time() - log['timestamp'] < 3600]  # Last hour
        
        event_counts = defaultdict(int)
        for event in recent_events:
            event_counts[event['event_type']] += 1
        
        return {
            'user_id': user_id,
            'total_events': len(user_logs),
            'recent_events_1h': len(recent_events),
            'event_breakdown': dict(event_counts),
            'risk_level': self._calculate_risk_level(event_counts),
            'last_event': user_logs[-1] if user_logs else None
        }
    
    def _calculate_risk_level(self, event_counts: Dict[str, int]) -> str:
        """Calculate user risk level based on recent activity."""
        risk_score = 0
        
        risk_weights = {
            'prompt_injection_attempt': 3,
            'malicious_upload_attempt': 2,
            'rate_limit_exceeded': 1,
            'harmful_response_generated': 2,
            'malicious_rate_limit_exceeded': 4
        }
        
        for event_type, count in event_counts.items():
            weight = risk_weights.get(event_type, 0)
            risk_score += count * weight
        
        if risk_score >= 10:
            return 'HIGH'
        elif risk_score >= 5:
            return 'MEDIUM'
        elif risk_score > 0:
            return 'LOW'
        else:
            return 'NONE'

# Global instance
enhanced_security = EnhancedSecurityMiddleware()
