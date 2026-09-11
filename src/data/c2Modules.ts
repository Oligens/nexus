export interface SimModule {
  id: string;
  name: string;
  mitre?: string;
  role: string;
  detection?: string;
  status: 'ready' | 'active' | 'locked';
}

export interface ModuleCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  cssClass: string;
  modules: SimModule[];
}

export const moduleCategories: ModuleCategory[] = [
  {
    id: 'infra',
    name: 'Core / Infrastructure',
    icon: '⬡',
    color: '#00F0FF',
    cssClass: 'cat-infra',
    modules: [
      { id: 'teamserver', name: 'Teamserver', role: 'Multi-operator, mTLS, RBAC', detection: 'Cert analysis', status: 'active' },
      { id: 'listener_http', name: 'HTTP/S Listener', role: 'Beacon malleable profile', detection: 'UA analysis', status: 'active' },
      { id: 'listener_dns', name: 'DNS Listener', role: 'TXT/A/AAAA tunnel', detection: 'DNS anomaly', status: 'ready' },
      { id: 'listener_smb', name: 'SMB Listener', role: 'Named pipe pivoting', detection: 'Pipe monitor', status: 'ready' },
      { id: 'listener_ws', name: 'WebSocket Listener', role: 'Bidirectional WS', detection: 'Upgrade detect', status: 'locked' },
      { id: 'payload_builder', name: 'Payload Builder', role: 'Stagers/stageless gen', detection: 'Entropy scan', status: 'active' },
      { id: 'crypto_layer', name: 'Crypto Layer', role: 'ECDH + AES-GCM', status: 'active' },
      { id: 'loot_db', name: 'Loot Database', role: 'Encrypted storage', status: 'active' },
    ]
  },
  {
    id: 'access',
    name: 'Initial Access Simulation',
    icon: '◈',
    color: '#ff8c00',
    cssClass: 'cat-access',
    modules: [
      { id: 'phish_builder', name: 'Phishing Builder', mitre: 'T1566', role: 'Email crafting sim', detection: 'SPF/DKIM', status: 'ready' },
      { id: 'macro_office', name: 'Office Macro Sim', mitre: 'T1204.002', role: 'Macro simulation', detection: 'Office child proc', status: 'ready' },
      { id: 'lnk_dropper', name: 'LNK Dropper Sim', mitre: 'T1204.001', role: 'Shortcut simulation', detection: 'LNK analysis', status: 'ready' },
      { id: 'iso_smuggle', name: 'ISO/IMG Smuggle', mitre: 'T1553.005', role: 'ISO mount sim', detection: 'Mount events', status: 'locked' },
      { id: 'html_smuggle', name: 'HTML Smuggling', mitre: 'T1027.006', role: 'Browser download sim', detection: 'File type scan', status: 'ready' },
      { id: 'oauth_device', name: 'OAuth Device Flow', mitre: 'T1528', role: 'Device code sim', detection: 'Flow analysis', status: 'ready' },
      { id: 'jwt_confusion', name: 'JWT Confusion Sim', mitre: 'T1550.001', role: 'Algorithm confusion', status: 'ready' },
      { id: 'saml_abuse', name: 'SAML Assertion Sim', mitre: 'T1606.002', role: 'Assertion test', status: 'locked' },
      { id: 'kerberoast_sim', name: 'Kerberoast Sim', mitre: 'T1558.003', role: 'SPN request sim', detection: 'SPN monitor', status: 'ready' },
      { id: 'asrep_sim', name: 'AS-REP Sim', mitre: 'T1558.004', role: 'Pre-auth test', status: 'ready' },
      { id: 'pwd_spray', name: 'Password Spray Sim', mitre: 'T1110.003', role: 'Auth attempt sim', detection: '4625 events', status: 'active' },
    ]
  },
  {
    id: 'exec',
    name: 'Execution / Evasion Sim',
    icon: '⊘',
    color: '#ff4444',
    cssClass: 'cat-exec',
    modules: [
      { id: 'amsi_sim', name: 'AMSI Bypass Sim', role: 'Memory patch test', detection: 'ETW provider', status: 'active' },
      { id: 'etw_sim', name: 'ETW Patch Sim', role: 'ETW disable test', detection: 'Sysmon gap', status: 'ready' },
      { id: 'unhook_sim', name: 'Unhooking Sim', role: 'Ntdll restore test', detection: '.text diff', status: 'ready' },
      { id: 'syscall_sim', name: 'Direct Syscall Sim', role: 'Syscall path test', detection: 'Stack analysis', status: 'active' },
      { id: 'sleep_sim', name: 'Sleep Obfuscation', role: 'RAM encrypt test', detection: 'Mem scan', status: 'ready' },
      { id: 'hollow_sim', name: 'Process Hollow Sim', mitre: 'T1055.012', role: 'Process injection test', status: 'ready' },
      { id: 'ppid_sim', name: 'PPID Spoof Sim', mitre: 'T1134.004', role: 'Parent spoof test', status: 'ready' },
      { id: 'sideload_sim', name: 'DLL Sideload Sim', mitre: 'T1574.002', role: 'DLL load test', status: 'ready' },
      { id: 'reflect_sim', name: 'Reflective Load Sim', mitre: 'T1620', role: 'In-memory PE test', status: 'locked' },
      { id: 'rop_sim', name: 'ROP Chain Sim', role: 'DEP/ASLR bypass test', status: 'locked' },
    ]
  },
  {
    id: 'persist',
    name: 'Persistence Simulation',
    icon: '⏣',
    color: '#a855f7',
    cssClass: 'cat-persist',
    modules: [
      { id: 'reg_run', name: 'Registry Run Sim', mitre: 'T1547.001', role: 'Run key test', detection: 'Reg monitor', status: 'ready' },
      { id: 'sched_task', name: 'Scheduled Task Sim', mitre: 'T1053.005', role: 'Task creation test', detection: 'Task audit', status: 'ready' },
      { id: 'wmi_sub', name: 'WMI Subscription', mitre: 'T1546.003', role: 'Event filter test', status: 'locked' },
      { id: 'svc_create', name: 'Service Creation Sim', mitre: 'T1543.003', role: 'Service install test', status: 'ready' },
      { id: 'com_hijack', name: 'COM Hijack Sim', mitre: 'T1546.015', role: 'CLSID test', status: 'locked' },
      { id: 'bits_job', name: 'BITS Job Sim', mitre: 'T1197', role: 'BITS persist test', status: 'ready' },
      { id: 'startup_sim', name: 'Startup Folder Sim', mitre: 'T1547.001', role: 'Startup link test', status: 'ready' },
      { id: 'uefi_sim', name: 'UEFI Bootkit Sim', mitre: 'T1542.001', role: 'Firmware test', status: 'locked' },
    ]
  },
  {
    id: 'privesc',
    name: 'Privilege Escalation Sim',
    icon: '⬆',
    color: '#D4AF37',
    cssClass: 'cat-privesc',
    modules: [
      { id: 'uac_sim', name: 'UAC Bypass Sim', role: 'fodhelper test', status: 'ready' },
      { id: 'token_sim', name: 'Token Impersonation', role: 'SeImpersonate test', status: 'active' },
      { id: 'potato_sim', name: 'Potato Attack Sim', role: 'Resolver test', status: 'ready' },
      { id: 'sudo_cve', name: 'Sudo CVE Sim', role: 'Sudo vuln test', status: 'locked' },
      { id: 'polkit_cve', name: 'Polkit CVE Sim', role: 'Polkit vuln test', status: 'ready' },
      { id: 'kernel_sim', name: 'Kernel Exploit Sim', role: 'LPE test', detection: 'Crash monitor', status: 'locked' },
      { id: 'adcs_sim', name: 'AD CS ESC Sim', role: 'Template test', status: 'ready' },
      { id: 'zerologon', name: 'Zerologon Sim', role: 'Netlogon test', status: 'locked' },
    ]
  },
  {
    id: 'cred',
    name: 'Credential Access Sim',
    icon: '⚿',
    color: '#00ff88',
    cssClass: 'cat-cred',
    modules: [
      { id: 'lsass_sim', name: 'LSASS Access Sim', role: 'Process handle test', detection: 'Handle audit', status: 'ready' },
      { id: 'sam_sim', name: 'SAM Registry Sim', role: 'Reg save test', status: 'ready' },
      { id: 'ntds_sim', name: 'NTDS Access Sim', role: 'VSS shadow test', status: 'locked' },
      { id: 'dpapi_sim', name: 'DPAPI Sim', role: 'Master key test', status: 'ready' },
      { id: 'browser_sim', name: 'Browser Data Sim', role: 'SQLite read test', status: 'active' },
      { id: 'keylog_sim', name: 'Keylogger Sim', role: 'Hook test', status: 'ready' },
      { id: 'cred_dump', name: 'Credential Dump Sim', role: 'Memory extract test', status: 'active' },
      { id: 'dcsync_sim', name: 'DCSync Sim', role: 'DRSUAPI test', status: 'ready' },
    ]
  },
  {
    id: 'discover',
    name: 'Discovery Simulation',
    icon: '◎',
    color: '#00bfff',
    cssClass: 'cat-discover',
    modules: [
      { id: 'ad_enum', name: 'AD Enumeration', mitre: 'T1087.002', role: 'Domain object query', status: 'active' },
      { id: 'bloodhound', name: 'AD Graph Collect', mitre: 'T1069.002', role: 'Graph data sim', status: 'ready' },
      { id: 'net_scan', name: 'Network Scan', mitre: 'T1046', role: 'Port/service scan', status: 'active' },
      { id: 'share_enum', name: 'Share Enumeration', mitre: 'T1135', role: 'SMB share scan', status: 'ready' },
      { id: 'gpo_enum', name: 'GPO Enumeration', mitre: 'T1615', role: 'Policy query', status: 'ready' },
      { id: 'session_enum', name: 'Session Enumeration', mitre: 'T1049', role: 'Session query', status: 'ready' },
    ]
  },
  {
    id: 'lateral',
    name: 'Lateral Movement Sim',
    icon: '⇌',
    color: '#ff6b9d',
    cssClass: 'cat-lateral',
    modules: [
      { id: 'psexec_sim', name: 'Remote Exec Sim', role: 'SMB service test', detection: 'SCM events', status: 'ready' },
      { id: 'wmi_exec', name: 'WMI Exec Sim', role: 'Win32_Process test', status: 'ready' },
      { id: 'winrm_exec', name: 'WinRM Exec Sim', role: '5985/5986 test', status: 'active' },
      { id: 'dcom_exec', name: 'DCOM Exec Sim', role: 'COM activation test', status: 'locked' },
      { id: 'ssh_pivot', name: 'SSH Pivot Sim', role: 'Key auth test', status: 'ready' },
      { id: 'rdp_hijack', name: 'RDP Hijack Sim', role: 'Session takeover test', status: 'locked' },
      { id: 'pass_hash', name: 'Pass-the-Hash Sim', role: 'NTLM auth test', detection: '4624 type 3', status: 'ready' },
      { id: 'pass_ticket', name: 'Pass-the-Ticket Sim', role: 'Kerberos TGS test', detection: 'TGS analysis', status: 'ready' },
      { id: 'overpass', name: 'Overpass Hash Sim', role: 'Kerberos TGT test', status: 'locked' },
    ]
  },
  {
    id: 'collect',
    name: 'Collection / Exfil Sim',
    icon: '⬢',
    color: '#ffd700',
    cssClass: 'cat-collect',
    modules: [
      { id: 'screen_sim', name: 'Screen Capture Sim', role: 'GDI hook test', status: 'ready' },
      { id: 'audio_sim', name: 'Audio Capture Sim', role: 'Mic access test', status: 'locked' },
      { id: 'webcam_sim', name: 'Webcam Capture Sim', role: 'DirectShow test', status: 'locked' },
      { id: 'clip_sim', name: 'Clipboard Monitor Sim', role: 'Clip hook test', status: 'ready' },
      { id: 'email_sim', name: 'Email Collect Sim', role: 'MAPI access test', status: 'ready' },
      { id: 'file_stage', name: 'File Staging Sim', role: 'Archive test', status: 'active' },
      { id: 'dns_exfil', name: 'DNS Exfil Sim', role: 'DNS query test', detection: 'DNS length', status: 'ready' },
      { id: 'https_exfil', name: 'HTTPS Exfil Sim', role: 'Upload volume test', status: 'ready' },
      { id: 'icmp_exfil', name: 'ICMP Exfil Sim', role: 'ICMP payload test', status: 'locked' },
      { id: 'cloud_exfil', name: 'Cloud Exfil Sim', role: 'API token test', status: 'ready' },
      { id: 'stego_exfil', name: 'Stego Exfil Sim', role: 'Image LSB test', status: 'locked' },
    ]
  },
  {
    id: 'antiforen',
    name: 'Anti-Forensics Sim',
    icon: '⊗',
    color: '#888888',
    cssClass: 'antiforensics',
    modules: [
      { id: 'log_wipe', name: 'Log Clear Sim', mitre: 'T1070.001', role: 'Event log test', detection: 'Event 1102', status: 'ready' },
      { id: 'timestomp', name: 'Timestomp Sim', mitre: 'T1070.006', role: 'Timestamp mod test', status: 'ready' },
      { id: 'usn_wipe', name: 'USN Journal Sim', mitre: 'T1070.004', role: 'Journal clear test', status: 'locked' },
      { id: 'prefetch_wipe', name: 'Prefetch Sim', mitre: 'T1070.004', role: 'Prefetch clear test', status: 'locked' },
      { id: 'shimcache', name: 'ShimCache Sim', mitre: 'T1070.004', role: 'Registry mod test', status: 'locked' },
      { id: 'eventlog_dis', name: 'EventLog Disable', mitre: 'T1562.002', role: 'Service stop test', status: 'ready' },
      { id: 'av_kill', name: 'AV Disable Sim', mitre: 'T1562.001', role: 'Process terminate test', status: 'ready' },
      { id: 'fw_rule', name: 'Firewall Rule Sim', mitre: 'T1562.004', role: 'Netsh rule test', status: 'ready' },
      { id: 'rootkit_user', name: 'Userland Rootkit Sim', mitre: 'T1014', role: 'Syscall hook test', status: 'locked' },
      { id: 'rootkit_kern', name: 'Kernel Rootkit Sim', mitre: 'T1014', role: 'Driver test', status: 'locked' },
      { id: 'vm_detect', name: 'VM Detection Sim', mitre: 'T1497.001', role: 'CPUID/MAC test', status: 'active' },
      { id: 'sandbox_det', name: 'Sandbox Detect Sim', mitre: 'T1497.001', role: 'Timing test', status: 'active' },
    ]
  },
];

export interface Beacon {
  id: string;
  hostname: string;
  username: string;
  ip: string;
  os: string;
  arch: string;
  pid: number;
  status: 'active' | 'idle' | 'dead';
  lastSeen: string;
  listener: string;
  integrity: 'user' | 'admin' | 'system';
  process: string;
}

export const beacons: Beacon[] = [
  { id: 'B-001', hostname: 'WS-FINANCE-07', username: 'CORP\\j.smith', ip: '10.12.40.17', os: 'Windows 10 22H2', arch: 'x64', pid: 4872, status: 'active', lastSeen: '2s', listener: 'https-main', integrity: 'admin', process: 'rundll32.exe' },
  { id: 'B-002', hostname: 'DC-PRIMARY', username: 'CORP\\svc_backup', ip: '10.10.1.5', os: 'Windows Server 2019', arch: 'x64', pid: 1204, status: 'active', lastSeen: '5s', listener: 'dns-tunnel', integrity: 'system', process: 'svchost.exe' },
  { id: 'B-003', hostname: 'DEV-LINUX-03', username: 'deploy@dev', ip: '10.12.50.22', os: 'Ubuntu 22.04', arch: 'x64', pid: 8834, status: 'idle', lastSeen: '45s', listener: 'https-main', integrity: 'user', process: '.systemd-private' },
  { id: 'B-004', hostname: 'W10-RECEPTION', username: 'CORP\\m.jones', ip: '10.12.40.88', os: 'Windows 10 21H2', arch: 'x64', pid: 3301, status: 'active', lastSeen: '1s', listener: 'smb-pipe', integrity: 'user', process: 'explorer.exe' },
  { id: 'B-005', hostname: 'EXCHANGE-01', username: 'NT AUTH\\SYSTEM', ip: '10.10.1.12', os: 'Windows Server 2016', arch: 'x64', pid: 921, status: 'dead', lastSeen: '12m', listener: 'https-main', integrity: 'system', process: 'w3wp.exe' },
  { id: 'B-006', hostname: 'LAPTOP-CEO', username: 'CORP\\admin_ceo', ip: '10.12.100.3', os: 'Windows 11 23H2', arch: 'x64', pid: 7744, status: 'idle', lastSeen: '2m', listener: 'ws-secure', integrity: 'admin', process: 'OneDrive.exe' },
];

export interface Listener {
  id: string;
  name: string;
  type: 'HTTP/S' | 'DNS' | 'SMB' | 'WebSocket';
  host: string;
  port: number;
  status: 'active' | 'stopped';
  beacons: number;
  profile: string;
}

export const listeners: Listener[] = [
  { id: 'L-01', name: 'https-main', type: 'HTTP/S', host: 'cdn-assets.cloudfront.net', port: 443, status: 'active', beacons: 3, profile: 'amazon-clone' },
  { id: 'L-02', name: 'dns-tunnel', type: 'DNS', host: 'ns1.legit-updates.com', port: 53, status: 'active', beacons: 1, profile: 'dns-txt-a' },
  { id: 'L-03', name: 'smb-pipe', type: 'SMB', host: '\\\\.\\pipe\\msagent_42', port: 445, status: 'active', beacons: 1, profile: 'smb-named' },
  { id: 'L-04', name: 'ws-secure', type: 'WebSocket', host: 'wss.api-analytics.io', port: 8443, status: 'stopped', beacons: 1, profile: 'ws-binary' },
];

export interface TaskItem {
  id: string;
  beaconId: string;
  module: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  timestamp: string;
  output?: string;
}

export const taskQueue: TaskItem[] = [
  { id: 'T-1042', beaconId: 'B-001', module: 'ad_enum', status: 'running', timestamp: '14:32:07' },
  { id: 'T-1041', beaconId: 'B-002', module: 'dcsync_sim', status: 'completed', timestamp: '14:31:45', output: '[+] Hash captured: admin@$CORP:500:aad3b435b...' },
  { id: 'T-1040', beaconId: 'B-004', module: 'net_scan', status: 'completed', timestamp: '14:30:22', output: '[+] 47 hosts discovered in 10.12.40.0/24' },
  { id: 'T-1039', beaconId: 'B-001', module: 'lsass_sim', status: 'failed', timestamp: '14:29:58', output: '[-] Access denied - PPL enabled' },
  { id: 'T-1038', beaconId: 'B-003', module: 'ssh_pivot', status: 'queued', timestamp: '14:28:11' },
  { id: 'T-1037', beaconId: 'B-002', module: 'bloodhound', status: 'completed', timestamp: '14:27:03', output: '[+] 2847 nodes, 8921 edges collected' },
];
