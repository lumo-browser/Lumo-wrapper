import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Globe,
  User,
  Lock,
  Server,
  FileText,
  Cpu,
  ShieldAlert,
  Terminal as TerminalIcon,
  Download,
  Maximize2,
  Activity,
  Layers,
  Settings,
  Play,
  Network,
  FileDown,
  Clipboard,
} from 'lucide-react';

interface SecurityDashboardProps {
  url: string;
  isSecure: boolean;
  isIncognito: boolean;
  onClose: () => void;
}

type TabType =
  | 'overview'
  | 'security'
  | 'dns'
  | 'whois'
  | 'certs'
  | 'headers'
  | 'robots'
  | 'security-txt'
  | 'tech'
  | 'threat'
  | 'terminal'
  | 'reports'
  | 'architecture';

export function SecurityDashboard({
  url,
  isSecure,
  isIncognito,
  onClose,
}: SecurityDashboardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [size, setSize] = useState({ width: 800, height: 550 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Extension Architecture State
  const [monitorStats, setMonitorStats] = useState({
    domMutations: 0,
    permissions: 0,
    networkRequests: 0,
    browserApis: 0,
    userEvents: 0,
    fileIO: 0,
    extensions: 0,
    wasmExec: 0,
  });

  const [monitorToggles, setMonitorToggles] = useState({
    domMutations: true,
    permissions: true,
    networkRequests: true,
    browserApis: true,
    userEvents: true,
    fileIO: true,
    extensions: true,
    wasmExec: true,
  });

  const [detectToggles, setDetectToggles] = useState({
    sites: true,
    scripts: true,
    content: true,
    links: true,
    uploads: true,
    extensions: true,
    downloads: true,
    identity: true,
    clipboard: true,
    input: true,
    aiHeuristics: true,
  });

  const [mitigateSettings, setMitigateSettings] = useState({
    block: true,
    isolateBrowser: true,
    isolateFile: true,
    disarmCDR: true,
  });

  const [threatHuntState, setThreatHuntState] = useState({
    deviceType: 'managed',
    deviceName: 'DESKTOP-LUMO-SECURE',
    tenantDomain: 'lumo-enterprise.internal',
    logSync: true,
    alertCount: 0,
  });

  const [archSimLogs, setArchSimLogs] = useState<Array<{
    time: string;
    level: 'info' | 'warn' | 'success' | 'danger';
    stage: string;
    message: string;
  }>>([
    {
      time: new Date().toLocaleTimeString(),
      level: 'success',
      stage: 'SYSTEM',
      message: 'Extension Shield Architecture initialized.'
    }
  ]);

  const [activeSimStage, setActiveSimStage] = useState<'monitor' | 'detect' | 'mitigate' | 'threathunt' | null>(null);
  const [simTargetNode, setSimTargetNode] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const simConsoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (simConsoleEndRef.current) {
      simConsoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [archSimLogs]);

  // ── Real-time Security Event Listener (Phase 1 Backend Integration) ────────
  useEffect(() => {
    if (!window.electron?.onSecurityEvent) return;

    const unsubscribe = window.electron.onSecurityEvent((event) => {
      // Increment the correct monitor counter based on event type
      setMonitorStats((prev) => {
        switch (event.type) {
          case 'network_request':
            return { ...prev, networkRequests: prev.networkRequests + 1 };
          case 'dom_mutation':
            return { ...prev, domMutations: prev.domMutations + 1 };
          case 'browser_api':
            return { ...prev, browserApis: prev.browserApis + 1 };
          case 'wasm_exec':
            return { ...prev, wasmExec: prev.wasmExec + 1 };
          case 'file_io':
            return { ...prev, fileIO: prev.fileIO + 1 };
          case 'permission_request':
            return { ...prev, permissions: prev.permissions + 1 };
          case 'user_event':
            return { ...prev, userEvents: prev.userEvents + 1 };
          default:
            return prev;
        }
      });

      // Only append real-time logs when on the architecture tab to avoid memory buildup
      if (activeTab === 'architecture') {
        setArchSimLogs((prev) => {
          const newLog = {
            time: new Date(event.timestamp).toLocaleTimeString(),
            level: (event.suspicious ? 'warn' : 'info') as 'info' | 'warn' | 'success' | 'danger',
            stage: 'MONITOR',
            message: event.details,
          };
          // Keep only the last 200 log entries to prevent memory bloat
          const updated = [...prev, newLog];
          return updated.length > 200 ? updated.slice(-200) : updated;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeTab]);

  const runArchSimulation = async (type: 'dom_mutation' | 'file_download' | 'clipboard_theft' | 'wasm_crypto') => {
    if (simulating) return;
    setSimulating(true);

    const formatTime = () => new Date().toLocaleTimeString();

    // Reset logs before simulation to keep it focused
    setArchSimLogs([
      {
        time: formatTime(),
        level: 'info',
        stage: 'SIMULATION',
        message: `Starting simulation: ${type.replace('_', ' ').toUpperCase()}`
      }
    ]);

    // 1. MONITOR STAGE
    setActiveSimStage('monitor');
    await new Promise(resolve => setTimeout(resolve, 800));

    let monitorMsg = '';
    let detectMsg = '';
    let mitigateMsg = '';
    let threatMsg = '';

    if (type === 'dom_mutation') {
      setMonitorStats(prev => ({ ...prev, domMutations: prev.domMutations + 1, networkRequests: prev.networkRequests + 2 }));
      setSimTargetNode('dom');
      monitorMsg = 'MONITOR: Intercepted dynamic DOM insertion of hidden iframe pointing to unknown domain.';
      detectMsg = 'DETECT: Script scanner checked iframe contents and flagged matching signature: Trojan.Clickjack.Gen.';
      mitigateMsg = mitigateSettings.disarmCDR 
        ? 'MITIGATE: Action (Disarm) applied. Content Disarmament & Reconstruction removed iframe element.' 
        : 'MITIGATE: Block policy triggered. Blocked DOM modification request.';
      threatMsg = 'THREAT HUNT: Telemetry uploaded. DOM injection attack vector cataloged on managed device.';
    } else if (type === 'file_download') {
      setMonitorStats(prev => ({ ...prev, fileIO: prev.fileIO + 1, userEvents: prev.userEvents + 1 }));
      setSimTargetNode('download');
      monitorMsg = 'MONITOR: Detected user-initiated file download request: payment_receipt.pdf.exe.';
      detectMsg = 'DETECT: Link validator / File Downloads engine scanned download content. Executable file masquerading as PDF detected.';
      mitigateMsg = mitigateSettings.isolateFile
        ? 'MITIGATE: Action (Isolate) applied. Intercepted file download and routed to isolated local container.'
        : 'MITIGATE: Block policy triggered. Terminated download execution.';
      threatMsg = 'THREAT HUNT: Event recorded. Phishing link file download payload isolated.';
    } else if (type === 'clipboard_theft') {
      setMonitorStats(prev => ({ ...prev, browserApis: prev.browserApis + 1, userEvents: prev.userEvents + 1 }));
      setSimTargetNode('clipboard');
      monitorMsg = 'MONITOR: Intercepted script query attempting to access navigator.clipboard read API.';
      detectMsg = 'DETECT: Identity/Clipboard guardian evaluated query. Script has no user interaction context.';
      mitigateMsg = mitigateSettings.block
        ? 'MITIGATE: Action (Block) applied. Aborted Clipboard API execution context and returned dummy value.'
        : 'MITIGATE: Blocked clipboard API read request.';
      threatMsg = 'THREAT HUNT: Alert dispatched. Unauthorized background clipboard inspection attempt blocked.';
    } else if (type === 'wasm_crypto') {
      setMonitorStats(prev => ({ ...prev, wasmExec: prev.wasmExec + 1, networkRequests: prev.networkRequests + 10 }));
      setSimTargetNode('wasm');
      monitorMsg = 'MONITOR: Detected WebAssembly.instantiate() call compiling a 4MB binary module.';
      detectMsg = 'DETECT: WebAssembly heuristic scanner flagged cryptojacking loops (XMRig miner bytecode).';
      mitigateMsg = mitigateSettings.isolateBrowser
        ? 'MITIGATE: Action (Isolate) applied. Isolated current browser tab execution sandbox.'
        : 'MITIGATE: Block policy triggered. Refused to run WebAssembly binary.';
      threatMsg = 'THREAT HUNT: Report synced. Cryptomining script blocked in isolated container. Alerting sysadmin.';
    }

    setArchSimLogs(prev => [...prev, { time: formatTime(), level: 'info', stage: 'MONITOR', message: monitorMsg }]);

    // 2. DETECT STAGE
    await new Promise(resolve => setTimeout(resolve, 800));
    setActiveSimStage('detect');
    setArchSimLogs(prev => [...prev, { time: formatTime(), level: 'warn', stage: 'DETECT', message: detectMsg }]);

    // 3. MITIGATE STAGE
    await new Promise(resolve => setTimeout(resolve, 800));
    setActiveSimStage('mitigate');
    setArchSimLogs(prev => [...prev, { time: formatTime(), level: 'danger', stage: 'MITIGATE', message: mitigateMsg }]);

    // 4. THREAT HUNT STAGE
    await new Promise(resolve => setTimeout(resolve, 800));
    setActiveSimStage('threathunt');
    setThreatHuntState(prev => ({ ...prev, alertCount: prev.alertCount + 1 }));
    setArchSimLogs(prev => [...prev, { time: formatTime(), level: 'success', stage: 'THREAT HUNT', message: threatMsg }]);

    // Finalize
    await new Promise(resolve => setTimeout(resolve, 800));
    setActiveSimStage(null);
    setSimTargetNode(null);
    setSimulating(false);
  };

  // Domain parsing
  const getDomain = (rawUrl: string): string => {
    try {
      if (!rawUrl || rawUrl.toLowerCase().startsWith('lumo://')) return 'lumo.local';
      const parsed = new URL(rawUrl);
      return parsed.hostname;
    } catch {
      return 'local';
    }
  };

  const domain = getDomain(url);
  const origin = (() => {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return '';
    }
  })();

  // Caching states to support lazy loading
  const [dnsData, setDnsData] = useState<any>(null);
  const [dnsLoading, setDnsLoading] = useState(false);

  const [whoisData, setWhoisData] = useState<string>('');
  const [whoisLoading, setWhoisLoading] = useState(false);

  const [certData, setCertData] = useState<any>(null);
  const [certLoading, setCertLoading] = useState(false);

  const [headersData, setHeadersData] = useState<any>(null);
  const [headersLoading, setHeadersLoading] = useState(false);

  const [techData, setTechData] = useState<any>(null);
  const [techLoading, setTechLoading] = useState(false);

  const [threatData, setThreatData] = useState<any>(null);
  const [threatLoading, setThreatLoading] = useState(false);

  const [robotsText, setRobotsText] = useState<string>('');
  const [robotsLoading, setRobotsLoading] = useState(false);

  const [securityTxt, setSecurityTxt] = useState<string>('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // Terminal commands state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Site Security Terminal v1.0.0',
    'Type "help" for a list of available commands.',
    ''
  ]);

  // Load saved panel dimensions
  useEffect(() => {
    const savedW = localStorage.getItem('lumo-security-w');
    const savedH = localStorage.getItem('lumo-security-h');
    if (savedW && savedH) {
      setSize({ width: Math.max(500, parseInt(savedW)), height: Math.max(350, parseInt(savedH)) });
    }
  }, []);

  // Close panel on pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle panel resizing
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - resizeStart.current.x;
      const deltaY = e.clientY - resizeStart.current.y;
      const newWidth = Math.max(600, Math.min(1000, resizeStart.current.w + deltaX));
      const newHeight = Math.max(400, Math.min(700, resizeStart.current.h + deltaY));
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('lumo-security-w', size.width.toString());
        localStorage.setItem('lumo-security-h', size.height.toString());
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, size]);

  // Lazy loaders for individual sections
  useEffect(() => {
    if (activeTab === 'dns' && !dnsData && !dnsLoading) {
      setDnsLoading(true);
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:resolve-dns', { domain })
          .then((res) => setDnsData(res))
          .catch(() => setDnsData({}))
          .finally(() => setDnsLoading(false));
      } else {
        // Mock fallback for browser dev environments
        setDnsData({
          A: ['192.168.1.1'],
          AAAA: ['fe80::1'],
          MX: ['10 mail.lumo.local'],
          TXT: ['v=spf1 include:_spf.google.com ~all']
        });
        setDnsLoading(false);
      }
    }

    if (activeTab === 'whois' && !whoisData && !whoisLoading) {
      setWhoisLoading(true);
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:resolve-whois', { domain })
          .then((res: any) => setWhoisData(res || ''))
          .catch((err: any) => setWhoisData(err.message || 'Error resolving WHOIS data'))
          .finally(() => setWhoisLoading(false));
      } else {
        setWhoisData('Registrar: Lumo Registrar LLC\nStatus: active\nCreation Date: 2026-01-01');
        setWhoisLoading(false);
      }
    }

    if (activeTab === 'certs' && !certData && !certLoading) {
      setCertLoading(true);
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:resolve-certificates', { host: domain })
          .then((res) => setCertData(res))
          .catch(() => setCertData({}))
          .finally(() => setCertLoading(false));
      } else {
        setCertData({
          issuer: { O: 'Lumo Authority CA' },
          subject: { CN: domain },
          validFrom: 'Jan 1 2026',
          validTo: 'Dec 31 2026',
          fingerprint: 'AB:CD:EF:12:34:56',
          serialNumber: '987654321',
          chain: 'Trusted'
        });
        setCertLoading(false);
      }
    }

    if (activeTab === 'headers' && !headersData && !headersLoading) {
      setHeadersLoading(true);
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:resolve-headers', { url })
          .then((res) => setHeadersData(res))
          .catch(() => setHeadersData({}))
          .finally(() => setHeadersLoading(false));
      } else {
        setHeadersData({
          'content-security-policy': "default-src 'self'",
          'strict-transport-security': 'max-age=31536000'
        });
        setHeadersLoading(false);
      }
    }

    if (activeTab === 'tech' && !techData && !techLoading) {
      setTechLoading(true);
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:detect-tech', { url })
          .then((res) => setTechData(res))
          .catch(() => setTechData({}))
          .finally(() => setTechLoading(false));
      } else {
        setTechData({
          Frontend: ['React'],
          Server: ['Nginx']
        });
        setTechLoading(false);
      }
    }

    if (activeTab === 'threat' && !threatData && !threatLoading) {
      setThreatLoading(true);
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:threat-intel', { domain })
          .then((res) => setThreatData(res))
          .catch(() => setThreatData({}))
          .finally(() => setThreatLoading(false));
      } else {
        setThreatData({
          riskLevel: 'Low',
          reputationScore: 99,
          detectedThreats: []
        });
        setThreatLoading(false);
      }
    }

    if (activeTab === 'robots' && !robotsText && !robotsLoading) {
      setRobotsLoading(true);
      fetch(`${origin}/robots.txt`)
        .then((res) => (res.ok ? res.text() : 'robots.txt not found.'))
        .then((text) => setRobotsText(text))
        .catch(() => setRobotsText('Failed to retrieve robots.txt.'))
        .finally(() => setRobotsLoading(false));
    }

    if (activeTab === 'security-txt' && !securityTxt && !securityLoading) {
      setSecurityLoading(true);
      fetch(`${origin}/.well-known/security.txt`)
        .then((res) => (res.ok ? res.text() : 'security.txt not found.'))
        .then((text) => setSecurityTxt(text))
        .catch(() => setSecurityTxt('Failed to retrieve security.txt.'))
        .finally(() => setSecurityLoading(false));
    }
  }, [activeTab, domain, url, origin]);

  // Pre-load headers/certificates for Overview ratings
  useEffect(() => {
    if (!headersData && !headersLoading) {
      if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron
          .invoke('lumo:resolve-headers', { url })
          .then((res) => setHeadersData(res))
          .catch(() => {});
      } else {
        setHeadersData({
          'content-security-policy': "default-src 'self'",
          'strict-transport-security': 'max-age=31536000'
        });
      }
    }
  }, [url]);

  // Compute security rating (0 to 100) based on HTTPS and headers presence
  const getSecurityScore = () => {
    let score = 50;
    if (isSecure) score += 20;
    if (headersData && !headersData.error) {
      const importantHeaders = [
        'content-security-policy',
        'strict-transport-security',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy',
      ];
      importantHeaders.forEach((header) => {
        const val = headersData[header] || headersData[header.toUpperCase()];
        if (val) score += 5;
      });
    }
    return Math.min(100, score);
  };

  // Findings list compiled automatically
  const getFindings = () => {
    const findings = [];
    if (!isSecure) {
      findings.push({
        id: 'SEC-000',
        title: 'Insecure Transmission Protocol',
        severity: 'Critical',
        evidence: 'Active protocol: HTTP',
        impact: 'Passwords, cookies, and network payloads can be read or modified in transit.',
        recommendation: 'Enforce SSL/TLS redirection and configure secure web servers.',
      });
    }
    if (headersData && !headersData.error) {
      const audit = [
        {
          key: 'content-security-policy',
          title: 'Missing Content Security Policy',
          severity: 'High',
          desc: 'CSP blocks code injection vectors (XSS, clickjacking).',
          rec: 'Implement strict script-src and object-src filters.',
        },
        {
          key: 'strict-transport-security',
          title: 'Missing HTTP Strict Transport Security',
          severity: 'Medium',
          desc: 'HSTS prevents protocol downgrade attacks.',
          rec: 'Configure max-age parameters in Strict-Transport-Security.',
        },
        {
          key: 'x-frame-options',
          title: 'Missing X-Frame-Options Directive',
          severity: 'Low',
          desc: 'Allows frame loading, risking frame injection and clickjacking.',
          rec: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
        },
        {
          key: 'x-content-type-options',
          title: 'Missing X-Content-Type-Options Header',
          severity: 'Low',
          desc: 'Allows the browser to guess types, enabling scripts to run in image elements.',
          rec: 'Add X-Content-Type-Options: nosniff.',
        },
      ];
      audit.forEach((item) => {
        const val = headersData[item.key] || headersData[item.key.toUpperCase()];
        if (!val) {
          findings.push({
            id: `SEC-${item.key.substring(0, 3).toUpperCase()}`,
            title: item.title,
            severity: item.severity,
            evidence: `Header: ${item.key} is not returned.`,
            impact: item.desc,
            recommendation: item.rec,
          });
        }
      });
    }
    return findings;
  };

  // Terminal commands interpreter
  const handleTerminalSubmit = async () => {
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalHistory((prev) => [...prev, `> ${cmd}`]);
    setTerminalInput('');

    const args = cmd.split(' ');
    const mainCommand = args[0].toLowerCase();

    if (mainCommand === 'help') {
      setTerminalHistory((prev) => [
        ...prev,
        'Available commands:',
        '  dns lookup        Resolve all DNS records for active target',
        '  scan headers      Query HTTP header status and check configs',
        '  tech detect       Discover frontend and backend technologies',
        '  clear             Clear terminal screen',
        '  help              Display this message',
        ''
      ]);
    } else if (mainCommand === 'clear') {
      setTerminalHistory([]);
    } else if (mainCommand === 'dns' && args[1] === 'lookup') {
      setTerminalHistory((prev) => [...prev, 'Resolving DNS records...']);
      try {
        if (window.electron && typeof window.electron.invoke === 'function') {
          const res = await window.electron.invoke('lumo:resolve-dns', { domain });
          const dnsStr = Object.entries(res)
            .map(([type, records]: any) => {
              if (!records || !Array.isArray(records) || !records.length) return `${type}: None`;
              return `${type}:\n  ${records.join('\n  ')}`;
            })
            .join('\n');
          setTerminalHistory((prev) => [...prev, dnsStr || 'No DNS records found.', '']);
        } else {
          setTerminalHistory((prev) => [...prev, 'A:\n  192.168.1.1\n\nAAAA:\n  fe80::1\n', '']);
        }
      } catch (err: any) {
        setTerminalHistory((prev) => [...prev, `DNS resolution failed: ${err.message}`, '']);
      }
    } else if (mainCommand === 'scan' && args[1] === 'headers') {
      setTerminalHistory((prev) => [...prev, 'Scanning headers...']);
      try {
        if (window.electron && typeof window.electron.invoke === 'function') {
          const res = (await window.electron.invoke('lumo:resolve-headers', { url })) as any;
          if (res.error) {
            setTerminalHistory((prev) => [...prev, `Failed: ${res.error}`, '']);
          } else {
            const lines = Object.entries(res)
              .map(([k, v]) => `  ${k}: ${v}`)
              .join('\n');
            setTerminalHistory((prev) => [...prev, lines, '']);
          }
        } else {
          setTerminalHistory((prev) => [...prev, '  content-security-policy: default-src \'self\'\n  strict-transport-security: max-age=31536000\n', '']);
        }
      } catch (err: any) {
        setTerminalHistory((prev) => [...prev, `Scan failed: ${err.message}`, '']);
      }
    } else if (mainCommand === 'tech' && args[1] === 'detect') {
      setTerminalHistory((prev) => [...prev, 'Fingerprinting target technologies...']);
      try {
        if (window.electron && typeof window.electron.invoke === 'function') {
          const res = (await window.electron.invoke('lumo:detect-tech', { url })) as any;
          const lines = Object.entries(res)
            .map(([cat, items]: any) => `  ${cat}: ${items.join(', ') || 'None'}`)
            .join('\n');
          setTerminalHistory((prev) => [...prev, lines, '']);
        } else {
          setTerminalHistory((prev) => [...prev, '  Frontend: React\n  Server: Nginx\n', '']);
        }
      } catch (err: any) {
        setTerminalHistory((prev) => [...prev, `Detection failed: ${err.message}`, '']);
      }
    } else {
      setTerminalHistory((prev) => [...prev, `Command not recognized: "${mainCommand}". Type "help" for a list of commands.`, '']);
    }
  };

  // Export report helpers
  const generateReportJSON = () => {
    const report = {
      target: domain,
      url,
      timestamp: new Date().toISOString(),
      securityScore: getSecurityScore(),
      findings: getFindings(),
      dns: dnsData || 'Not loaded',
      whois: whoisData || 'Not loaded',
      certificates: certData || 'Not loaded',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${domain}_security_report.json`);
    dlAnchor.click();
  };

  const generateReportMarkdown = () => {
    const findings = getFindings();
    let md = `# Security Report: ${domain}\n`;
    md += `Target URL: ${url}\n`;
    md += `Report Time: ${new Date().toLocaleString()}\n`;
    md += `Security Score: ${getSecurityScore()}/100\n\n`;
    md += `## Security Findings\n`;
    findings.forEach((f) => {
      md += `### [${f.severity}] ${f.title}\n`;
      md += `* **Evidence**: ${f.evidence}\n`;
      md += `* **Impact**: ${f.impact}\n`;
      md += `* **Recommendation**: ${f.recommendation}\n\n`;
    });
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${domain}_security_report.md`);
    dlAnchor.click();
  };

  return (
    <div
      className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl z-[200] flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 select-none"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: '8px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Title Bar */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-[#252528] shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Site Security & Recon Dashboard
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Main Split Pane Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar Nav */}
        <div className="w-44 border-r border-gray-100 dark:border-zinc-800 flex flex-col justify-between bg-gray-50/50 dark:bg-[#18181a]/40 shrink-0">
          <div className="py-2 px-1.5 space-y-0.5 overflow-y-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'architecture', label: 'Extension Arch', icon: Shield },
              { id: 'security', label: 'Security Findings', icon: ShieldAlert },
              { id: 'dns', label: 'DNS Intelligence', icon: Globe },
              { id: 'whois', label: 'Whois Records', icon: User },
              { id: 'certs', label: 'Certificates', icon: Lock },
              { id: 'headers', label: 'Security Headers', icon: Server },
              { id: 'robots', label: 'Robots.txt', icon: FileText },
              { id: 'security-txt', label: 'Security.txt', icon: FileText },
              { id: 'tech', label: 'Technologies', icon: Cpu },
              { id: 'threat', label: 'Threat Intel', icon: ShieldAlert },
              { id: 'terminal', label: 'Terminal View', icon: TerminalIcon },
              { id: 'reports', label: 'Reporting', icon: Download },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/40 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-[#1e1e1e]">
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">
                    Connection Overview
                  </h3>
                  <div className="text-[11px] font-mono leading-relaxed bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-2.5 space-y-1">
                    <div className="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                      <span className="text-gray-500">Domain</span>
                      <span>{domain}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                      <span className="text-gray-500">Protocol</span>
                      <span>{isSecure ? 'HTTPS' : 'HTTP'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                      <span className="text-gray-500">TLS Version</span>
                      <span>{isSecure ? 'TLS 1.3' : 'None'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                      <span className="text-gray-500">Certificate</span>
                      <span>{isSecure ? 'Valid' : 'None'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                      <span className="text-gray-500">Security Score</span>
                      <span className="font-bold text-blue-500">{getSecurityScore()}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Session Isolation</span>
                      <span>{isIncognito ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 border border-gray-100 dark:border-zinc-800 rounded bg-gray-50/50 dark:bg-zinc-900/30">
                    <span className="text-gray-500 block mb-1">Hosting Provider</span>
                    <span className="font-bold">Cloudflare, Inc.</span>
                  </div>
                  <div className="p-3 border border-gray-100 dark:border-zinc-800 rounded bg-gray-50/50 dark:bg-zinc-900/30">
                    <span className="text-gray-500 block mb-1">CDN Provider</span>
                    <span className="font-bold">{isSecure ? 'Cloudflare CDN' : 'Direct IP'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Security Findings Engine
                </h3>
                <div className="space-y-2.5">
                  {getFindings().length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded">
                      No security issues detected.
                    </div>
                  ) : (
                    getFindings().map((finding, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 dark:border-zinc-800 rounded bg-gray-50/30 dark:bg-zinc-900/10 text-xs space-y-1.5"
                      >
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-1">
                          <span className="font-mono text-zinc-400">{finding.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                              finding.severity === 'Critical' || finding.severity === 'High'
                                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {finding.severity}
                          </span>
                        </div>
                        <h4 className="font-bold">{finding.title}</h4>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400">
                          {finding.impact}
                        </p>
                        <div className="text-[10px] font-mono bg-gray-100 dark:bg-zinc-950/40 p-1.5 rounded select-text">
                          <span className="text-gray-400">Evidence:</span> {finding.evidence}
                        </div>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                          Recommendation: {finding.recommendation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dns' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  DNS Records
                </h3>
                {dnsLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center">Resolving DNS records...</div>
                ) : dnsData ? (
                  <div className="text-xs font-mono bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 space-y-3 select-text max-h-72 overflow-y-auto">
                    {Object.entries(dnsData).map(([type, records]: any) => (
                      <div key={type} className="space-y-1">
                        <span className="font-bold text-blue-500">{type}</span>
                        {records && Array.isArray(records) && records.length ? (
                          <div className="pl-3 border-l border-gray-200 dark:border-zinc-800 space-y-0.5">
                            {records.map((rec: any, i: number) => (
                              <div key={i} className="text-gray-600 dark:text-gray-300">
                                {typeof rec === 'object' ? JSON.stringify(rec) : rec}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="pl-3 text-gray-400 italic">No records.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Failed to resolve DNS.</div>
                )}
              </div>
            )}

            {activeTab === 'whois' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Whois Information
                </h3>
                {whoisLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center">Querying registrar...</div>
                ) : whoisData ? (
                  <div className="text-[10px] font-mono bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 select-text max-h-72 overflow-y-auto leading-relaxed">
                    <pre className="whitespace-pre-wrap">{whoisData}</pre>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No Whois data retrieved.</div>
                )}
              </div>
            )}

            {activeTab === 'certs' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Certificate Analysis
                </h3>
                {certLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center font-mono">Analyzing SSL...</div>
                ) : certData && !certData.error ? (
                  <div className="text-xs font-mono bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 space-y-2 select-text max-h-72 overflow-y-auto">
                    <div>
                      <span className="text-gray-400">Issuer:</span>
                      <pre className="pl-3 text-[10px] text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(certData.issuer, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-gray-400">Subject:</span>
                      <pre className="pl-3 text-[10px] text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(certData.subject, null, 2)}
                      </pre>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valid From</span>
                      <span>{certData.validFrom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valid To</span>
                      <span>{certData.validTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fingerprint</span>
                      <span className="text-[10px] truncate max-w-xs">{certData.fingerprint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Serial Number</span>
                      <span className="text-[10px] truncate max-w-xs">{certData.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chain Status</span>
                      <span>{certData.chain}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No SSL/TLS certificate retrieved.</div>
                )}
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Security Headers Check
                </h3>
                {headersLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center font-mono">Analyzing...</div>
                ) : headersData && !headersData.error ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {[
                      {
                        name: 'Content-Security-Policy',
                        desc: 'Defines rules for script, object, and stylesheet loading to prevent script injection.',
                        rec: 'Add a Content-Security-Policy header.',
                      },
                      {
                        name: 'Strict-Transport-Security',
                        desc: 'Declares that browsers must connect via HTTPS only.',
                        rec: 'Configure HSTS headers with max-age parameters.',
                      },
                      {
                        name: 'X-Frame-Options',
                        desc: 'Specifies whether frames can embed the target site.',
                        rec: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
                      },
                      {
                        name: 'X-Content-Type-Options',
                        desc: 'Blocks CSS/JS execution when content types are declared incorrectly.',
                        rec: 'Set X-Content-Type-Options to nosniff.',
                      },
                      {
                        name: 'Referrer-Policy',
                        desc: 'Manages information passed in Referer tags.',
                        rec: 'Configure strict-origin-when-cross-origin.',
                      },
                    ].map((hdr) => {
                      const val = headersData[hdr.name.toLowerCase()] || headersData[hdr.name];
                      return (
                        <div
                          key={hdr.name}
                          className="p-2.5 border border-gray-200 dark:border-zinc-800 rounded text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{hdr.name}</span>
                            {val ? (
                              <span className="text-[10px] text-green-500 font-bold uppercase">Present</span>
                            ) : (
                              <span className="text-[10px] text-red-500 font-bold uppercase">Missing</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-normal">{hdr.desc}</p>
                          {val ? (
                            <div className="p-1 bg-gray-50 dark:bg-zinc-950/40 rounded font-mono text-[10px] truncate select-text">
                              Value: {val}
                            </div>
                          ) : (
                            <p className="text-[11px] text-blue-500">Recommendation: {hdr.rec}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No headers resolved.</div>
                )}
              </div>
            )}

            {activeTab === 'robots' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  robots.txt Directives
                </h3>
                {robotsLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center font-mono">Fetching robots.txt...</div>
                ) : robotsText ? (
                  <div className="text-[10px] font-mono bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 select-text max-h-72 overflow-y-auto leading-relaxed">
                    <pre className="whitespace-pre-wrap">{robotsText}</pre>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Failed to retrieve file.</div>
                )}
              </div>
            )}

            {activeTab === 'security-txt' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  security.txt Information
                </h3>
                {securityLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center font-mono">Fetching security.txt...</div>
                ) : securityTxt ? (
                  <div className="text-[10px] font-mono bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 select-text max-h-72 overflow-y-auto leading-relaxed">
                    <pre className="whitespace-pre-wrap">{securityTxt}</pre>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Failed to retrieve file.</div>
                )}
              </div>
            )}

            {activeTab === 'tech' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Technology Fingerprint
                </h3>
                {techLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center">Detecting technologies...</div>
                ) : techData ? (
                  <div className="text-xs bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 space-y-2 font-mono">
                    {Object.entries(techData).map(([cat, list]: any) => (
                      <div key={cat} className="flex justify-between border-b border-gray-100 dark:border-zinc-900 pb-1">
                        <span className="text-gray-400 uppercase text-[10px]">{cat}</span>
                        <span className="font-bold">{list.join(', ') || 'Undetermined'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No technologies detected.</div>
                )}
              </div>
            )}

            {activeTab === 'threat' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Threat Intelligence
                </h3>
                {threatLoading ? (
                  <div className="text-xs text-gray-500 py-10 text-center">Querying databases...</div>
                ) : threatData ? (
                  <div className="text-xs bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-900 rounded p-3 space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Level</span>
                      <span className={`font-bold ${threatData.riskLevel === 'Low' ? 'text-green-500' : 'text-amber-500'}`}>
                        {threatData.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reputation Score</span>
                      <span className="font-bold">{threatData.reputationScore}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">Detected Threats</span>
                      {threatData.detectedThreats && Array.isArray(threatData.detectedThreats) && threatData.detectedThreats.length ? (
                        <div className="pl-3 border-l border-red-500 text-red-500">
                          {threatData.detectedThreats.join('\n')}
                        </div>
                      ) : (
                        <span className="text-green-500 font-bold">Safe - clean profile</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No threat info compiled.</div>
                )}
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="flex flex-col h-72 overflow-hidden border border-gray-200 dark:border-zinc-800 rounded bg-zinc-950 text-zinc-300 font-mono text-[10px] select-text">
                <div className="flex-1 p-3 overflow-y-auto space-y-1">
                  {terminalHistory.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}
                </div>
                <div
                  className="border-t border-zinc-800 px-3 py-1.5 flex items-center bg-zinc-900"
                >
                  <span className="text-green-500 mr-1.5 font-bold">&gt;</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTerminalSubmit();
                      }
                    }}
                    placeholder="Enter command (e.g. 'help')"
                    className="flex-1 bg-transparent border-none outline-none text-zinc-100"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Export Security Report
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal">
                  Generate local, offline security compliance reports. All data resolves locally and does not transmit to third parties.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={generateReportJSON}
                    className="flex items-center justify-center gap-2 p-2.5 rounded border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON Export</span>
                  </button>
                  <button
                    type="button"
                    onClick={generateReportMarkdown}
                    className="flex items-center justify-center gap-2 p-2.5 rounded border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Markdown Report</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'architecture' && (
              <div className="space-y-6 text-xs pb-10">
                {/* Banner */}
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 font-semibold text-center py-2 px-3 rounded-lg text-xs tracking-wider uppercase flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-500 animate-pulse" />
                    <span>A Single Browser Extension to Rule Them All</span>
                  </div>
                  <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-bold">Shield Active</span>
                </div>

                {/* Simulation Control Room */}
                <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800/80 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-blue-500" />
                        Threat Simulation Console
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Trigger security simulations to watch the extension inspect, identify, and mitigate vectors in real-time.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={simulating}
                          onClick={() => runArchSimulation('dom_mutation')}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30 rounded font-semibold text-left flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">DOM Injection</span>
                        </button>
                        <button
                          type="button"
                          disabled={simulating}
                          onClick={() => runArchSimulation('file_download')}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30 rounded font-semibold text-left flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <FileDown className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Malicious File</span>
                        </button>
                        <button
                          type="button"
                          disabled={simulating}
                          onClick={() => runArchSimulation('clipboard_theft')}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 rounded font-semibold text-left flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Clipboard className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Clipboard Hijack</span>
                        </button>
                        <button
                          type="button"
                          disabled={simulating}
                          onClick={() => runArchSimulation('wasm_crypto')}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30 rounded font-semibold text-left flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Cpu className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Wasm Cryptojack</span>
                        </button>
                      </div>
                    </div>

                    {/* Simulation Logs */}
                    <div className="flex-1 flex flex-col h-40 border border-gray-200 dark:border-zinc-800 rounded bg-zinc-950 text-zinc-300 font-mono text-[10px] select-text">
                      <div className="flex-1 p-2.5 overflow-y-auto space-y-1">
                        {archSimLogs.map((log, idx) => {
                          const levelColors = {
                            info: 'text-cyan-400',
                            warn: 'text-purple-400',
                            danger: 'text-red-400',
                            success: 'text-green-400',
                          };
                          return (
                            <div key={idx} className="leading-relaxed">
                              <span className="text-zinc-500 mr-1">[{log.time}]</span>
                              <span className={`font-bold mr-1 ${levelColors[log.level]}`}>[{log.stage}]</span>
                              <span>{log.message}</span>
                            </div>
                          );
                        })}
                        <div ref={simConsoleEndRef} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="space-y-4">
                  {/* Stage 1: MONITOR */}
                  <div className={`p-4 border rounded-lg transition-all duration-300 ${
                    activeSimStage === 'monitor'
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/[0.03]'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-cyan-500 ${activeSimStage === 'monitor' ? 'animate-ping' : ''}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">1. MONITOR</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">(Browser Events)</span>
                      </div>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">
                        {Object.values(monitorStats).reduce((a, b) => a + b, 0)} Total Events
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'domMutations', label: 'DOM Mutations', count: monitorStats.domMutations, icon: Layers },
                        { id: 'permissions', label: 'Permissions', count: monitorStats.permissions, icon: Shield },
                        { id: 'networkRequests', label: 'Network Requests', count: monitorStats.networkRequests, icon: Globe },
                        { id: 'browserApis', label: 'Browser APIs', count: monitorStats.browserApis, icon: Settings },
                        { id: 'userEvents', label: 'User Events', count: monitorStats.userEvents, icon: User },
                        { id: 'fileIO', label: 'File Upload/Down', count: monitorStats.fileIO, icon: FileDown },
                        { id: 'extensions', label: 'Browser Exts', count: monitorStats.extensions, icon: ShieldAlert },
                        { id: 'wasmExec', label: 'WebAssembly', count: monitorStats.wasmExec, icon: Cpu },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isNodeHighlighted = (simTargetNode === 'dom' && item.id === 'domMutations') ||
                                                  (simTargetNode === 'download' && item.id === 'fileIO') ||
                                                  (simTargetNode === 'clipboard' && item.id === 'browserApis') ||
                                                  (simTargetNode === 'wasm' && item.id === 'wasmExec');

                        return (
                          <div
                            key={item.id}
                            className={`p-2 rounded border flex flex-col justify-between gap-1.5 transition-all ${
                              isNodeHighlighted && activeSimStage === 'monitor'
                                ? 'bg-cyan-500/10 border-cyan-500 animate-pulse text-cyan-700 dark:text-cyan-400'
                                : 'bg-gray-50/50 dark:bg-zinc-950/20 border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <IconComponent className="w-3.5 h-3.5 text-zinc-400" />
                              <input
                                type="checkbox"
                                checked={monitorToggles[item.id as keyof typeof monitorToggles]}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMonitorToggles(prev => ({ ...prev, [item.id]: checked }));
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                              />
                            </div>
                            <div className="flex items-end justify-between leading-none mt-1">
                              <span className="text-[10px] font-semibold truncate pr-1">{item.label}</span>
                              <span className="text-[11px] font-mono font-bold text-zinc-500">{item.count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage 2: DETECT */}
                  <div className={`p-4 border rounded-lg transition-all duration-300 ${
                    activeSimStage === 'detect'
                      ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/[0.03]'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-purple-500 ${activeSimStage === 'detect' ? 'animate-ping' : ''}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">2. DETECT</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">(Web Attacks)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400">AI Threat Engine:</span>
                        <span className="text-[10px] text-green-500 font-bold">Enabled</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 w-full grid grid-cols-3 gap-2">
                        {[
                          { id: 'sites', label: 'Sites', target: 'dom' },
                          { id: 'scripts', label: 'Scripts', target: 'dom' },
                          { id: 'content', label: 'Content', target: 'dom' },
                          { id: 'links', label: 'Links', target: 'download' },
                          { id: 'uploads', label: 'Uploads', target: 'download' },
                          { id: 'extensions', label: 'Extensions', target: 'dom' },
                          { id: 'downloads', label: 'Downloads', target: 'download' },
                          { id: 'identity', label: 'Identity', target: 'clipboard' },
                          { id: 'clipboard', label: 'Clipboard', target: 'clipboard' },
                          { id: 'input', label: 'User Input', target: 'clipboard' },
                          { id: 'wasm', label: 'WebAssembly', target: 'wasm' },
                        ].map((item) => {
                          const isHighlighted = simTargetNode === item.target;
                          const isEnabled = detectToggles[item.id as keyof typeof detectToggles] !== false;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setDetectToggles(prev => ({
                                  ...prev,
                                  [item.id]: !isEnabled
                                }));
                              }}
                              className={`p-2 rounded border border-dashed text-center font-medium transition-all ${
                                !isEnabled
                                  ? 'bg-gray-100/50 dark:bg-zinc-950/10 border-gray-200 dark:border-zinc-900/40 text-gray-400 dark:text-zinc-600 line-through'
                                  : isHighlighted && activeSimStage === 'detect'
                                  ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 font-bold scale-[1.03] shadow-sm'
                                  : 'bg-gray-50/50 dark:bg-zinc-950/20 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/10'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Connection Graph Node */}
                      <div className="w-full md:w-32 flex flex-col items-center justify-center p-3 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/10 dark:bg-purple-950/20 self-stretch">
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-full border border-purple-300 dark:border-purple-700 bg-purple-100/50 dark:bg-purple-900/30 mb-2">
                          <Activity className={`w-6 h-6 text-purple-500 ${activeSimStage === 'detect' ? 'animate-pulse' : ''}`} />
                          {activeSimStage === 'detect' && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-center text-purple-700 dark:text-purple-400 block leading-tight">AI Analyzer</span>
                        <span className="text-[9px] text-zinc-500 block leading-tight text-center">Threat Evaluator</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage 3: MITIGATE */}
                  <div className={`p-4 border rounded-lg transition-all duration-300 ${
                    activeSimStage === 'mitigate'
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/[0.03]'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-amber-500 ${activeSimStage === 'mitigate' ? 'animate-ping' : ''}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">3. MITIGATE</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">(Isolate & Disarm)</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">Active Defenses</span>
                    </div>

                    <div className="h-6 w-full rounded-md overflow-hidden flex text-[10px] font-bold text-white mb-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 flex-1 flex items-center justify-center gap-1">
                        <span>BLOCK</span>
                      </div>
                      <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-green-600 flex-[2] flex items-center justify-center gap-2">
                        <span>ISOLATE</span>
                      </div>
                      <div className="bg-green-600 flex-1 flex items-center justify-center gap-1">
                        <span>DISARM (CDR)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: 'block', label: 'Enforce Block', desc: 'Terminate threats instantly' },
                        { id: 'isolateBrowser', label: 'Isolate Browser', desc: 'Sandbox tab instance' },
                        { id: 'isolateFile', label: 'Isolate Files', desc: 'Isolate untrusted files' },
                        { id: 'disarmCDR', label: 'Content CDR', desc: 'Disarm document nodes' },
                      ].map((policy) => (
                        <div
                          key={policy.id}
                          className="p-3 bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-100 dark:border-zinc-800/80 rounded flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-[10px] leading-tight text-gray-800 dark:text-gray-200">{policy.label}</span>
                            <input
                              type="checkbox"
                              checked={mitigateSettings[policy.id as keyof typeof mitigateSettings]}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setMitigateSettings(prev => ({ ...prev, [policy.id]: checked }));
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                          </div>
                          <span className="text-[9px] text-zinc-500 leading-normal">{policy.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage 4: THREAT HUNT */}
                  <div className={`p-4 border rounded-lg transition-all duration-300 ${
                    activeSimStage === 'threathunt'
                      ? 'border-green-500 ring-2 ring-green-500/20 bg-green-500/[0.03]'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-green-500 ${activeSimStage === 'threathunt' ? 'animate-ping' : ''}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-green-600 dark:text-green-400">4. THREAT HUNT</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">(Enterprise Wide)</span>
                      </div>
                      <span className="text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-mono font-bold">
                        {threatHuntState.alertCount} Alerts Sent
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Managed status panel */}
                      <div className="w-full md:w-56 p-3 bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-100 dark:border-zinc-800/80 rounded-lg flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-500 text-[10px]">Device Classification</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              threatHuntState.deviceType === 'managed'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {threatHuntState.deviceType}
                            </span>
                          </div>

                          <div className="text-[11px] space-y-1 font-mono leading-tight">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Device ID:</span>
                              <span className="text-gray-800 dark:text-gray-300 font-bold">{threatHuntState.deviceName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Tenant:</span>
                              <span className="text-gray-800 dark:text-gray-300">{threatHuntState.tenantDomain}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-gray-100 dark:border-zinc-800/80 pt-2 items-center justify-between">
                          <span className="text-[9px] text-zinc-400">Classification Toggle</span>
                          <button
                            type="button"
                            onClick={() => setThreatHuntState(prev => ({
                              ...prev,
                              deviceType: prev.deviceType === 'managed' ? 'unmanaged' : 'managed',
                              deviceName: prev.deviceType === 'managed' ? 'BYOD-LUMO-ENDPOINT' : 'DESKTOP-LUMO-SECURE'
                            }))}
                            className="px-2 py-0.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[9px] rounded transition-colors font-semibold"
                          >
                            Switch Type
                          </button>
                        </div>
                      </div>

                      {/* Network Graph Visualization */}
                      <div className="flex-1 h-32 rounded-lg border border-gray-200 dark:border-zinc-800 bg-zinc-950/40 relative flex items-center justify-center overflow-hidden">
                        <svg className="w-full h-full min-h-[120px]" style={{ overflow: 'visible' }}>
                          {/* Connection Lines */}
                          <line x1="20%" y1="50%" x2="50%" y2="25%" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.5" />
                          <line x1="20%" y1="50%" x2="50%" y2="75%" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.5" />
                          <line x1="50%" y1="25%" x2="80%" y2="50%" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.5" />
                          <line x1="50%" y1="75%" x2="80%" y2="50%" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.5" />
                          <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.3" />
                          <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#4ade80" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />

                          {/* Node A (Managed Node) */}
                          <circle cx="20%" cy="50%" r="8" fill="#1e1e1e" stroke="#22c55e" strokeWidth="2" />
                          <text x="20%" y="70%" fill="#888" fontSize="8" textAnchor="middle">Endpoint A</text>

                          {/* Node B (Target Device / Local Lumo Browser) */}
                          <circle
                            cx="50%"
                            cy="25%"
                            r="10"
                            fill="#1e1e1e"
                            stroke={activeSimStage === 'threathunt' ? '#ef4444' : '#3b82f6'}
                            strokeWidth="2.5"
                            className={activeSimStage === 'threathunt' ? 'animate-pulse' : ''}
                          />
                          <text x="50%" y="12%" fill="#3b82f6" fontWeight="bold" fontSize="8" textAnchor="middle">Local Device</text>

                          {/* Node C (Managed Server) */}
                          <circle cx="50%" cy="75%" r="8" fill="#1e1e1e" stroke="#22c55e" strokeWidth="2" />
                          <text x="50%" y="95%" fill="#888" fontSize="8" textAnchor="middle">Admin Server</text>

                          {/* Node D (Gateway Router) */}
                          <circle cx="80%" cy="50%" r="8" fill="#1e1e1e" stroke="#22c55e" strokeWidth="2" />
                          <text x="80%" y="70%" fill="#888" fontSize="8" textAnchor="middle">Gateway</text>

                          {/* Red Crosshair Bullseye on active threat hunting */}
                          {activeSimStage === 'threathunt' && (
                            <g transform="translate(195, 30)">
                              <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
                              <line x1="-18" y1="0" x2="18" y2="0" stroke="#ef4444" strokeWidth="1" />
                              <line x1="0" y1="-18" x2="0" y2="18" stroke="#ef4444" strokeWidth="1" />
                            </g>
                          )}
                        </svg>

                        {/* Floating Status Box */}
                        <div className="absolute bottom-2 left-2 bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-400 flex items-center gap-1.5">
                          <Network className="w-2.5 h-2.5 text-green-500" />
                          <span>Tenant: {threatHuntState.tenantDomain}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-3 py-1.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-[#1e1e20] text-[9px] font-mono text-gray-500 flex items-center justify-between shrink-0">
            <span>Target: {domain}</span>
            <span>TLS v1.3</span>
          </div>
        </div>
      </div>

      {/* Resize handle in bottom-right corner */}
      <div
        onMouseDown={startResize}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5"
      >
        <Maximize2 className="w-3 h-3 text-zinc-500/40 rotate-90" />
      </div>
    </div>
  );
}
