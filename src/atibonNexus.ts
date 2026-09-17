import { spawn } from 'child_process';
import * as path from 'path';

export interface AtibonConfig {
    targetHost?: string;
    targetPort?: number;
    useTls?: boolean;
    verbose?: boolean;
    authorizationToken: string;
    modules?: {
        exploit?: boolean;
        postExploit?: boolean;
        c2?: boolean;
        authBypass?: boolean;
        binaryExploit?: boolean;
        socialEng?: boolean;
        protocolCover?: boolean;
        adTest?: boolean;
        avEvasion?: boolean;
        antiForensics?: boolean;
    };
}

export class AtibonNexus {
    private scriptPath: string;

    constructor(scriptPath?: string) {
        this.scriptPath = scriptPath || path.resolve(__dirname, '../backend/atibon.py');
    }

    public async executeAudit(config: AtibonConfig): Promise<string> {
        return new Promise((resolve, reject) => {
            const args = [
                this.scriptPath,
                '--target-host', config.targetHost || '127.0.0.1',
                '--target-port', (config.targetPort || 8080).toString(),
                '--i-have-authorization', config.authorizationToken
            ];

            if (config.useTls) args.push('--use-tls');
            if (config.verbose) args.push('--verbose');

            if (config.modules) {
                if (config.modules.exploit) args.push('--exploit');
                if (config.modules.postExploit) args.push('--post-exploit');
                if (config.modules.c2) args.push('--c2');
                if (config.modules.authBypass) args.push('--auth-bypass');
                if (config.modules.binaryExploit) args.push('--binary-exploit');
                if (config.modules.socialEng) args.push('--social-eng');
                if (config.modules.protocolCover) args.push('--protocol-cover');
                if (config.modules.adTest) args.push('--ad-test');
                if (config.modules.avEvasion) args.push('--av-evasion');
                if (config.modules.antiForensics) args.push('--anti-forensics');
            }

            const child = spawn('python', args);
            let stdoutData = '';
            let stderrData = '';

            child.stdout.on('data', (data: Buffer) => {
                stdoutData += data.toString();
            });

            child.stderr.on('data', (data: Buffer) => {
                stderrData += data.toString();
            });

            child.on('close', (code: number | null) => {
                if (code === 0) {
                    resolve(stdoutData);
                } else {
                    reject(new Error(`ATIBON execution failed (exit code ${code}): ${stderrData}`));
                }
            });
        });
    }
}