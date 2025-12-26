import { NextRequest, NextResponse } from 'next/server';
import * as net from 'net';
import * as tls from 'tls';

interface SmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpEncryption: 'ssl' | 'tls' | 'none';
}

class SmtpTester {
  private logs: string[] = [];

  private log(message: string) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.logs.push(`${timestamp}: ${message}`);
  }

  private async sendCommand(socket: net.Socket | tls.TLSSocket, command: string, expectedCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const maskedCommand = command.includes('AUTH LOGIN') || command.includes('PASS') 
        ? 'CONFIDENTIAL' 
        : command;
      this.log(`> ${maskedCommand}`);
      
      socket.write(command + '\r\n');
      
      let response = '';
      const timeout = setTimeout(() => {
        socket.removeAllListeners('data');
        reject(new Error('SMTP response timeout'));
      }, 10000);

      const onData = (chunk: Buffer) => {
        response += chunk.toString();
        if (response.includes('\r\n')) {
          const lines = response.split('\r\n');
          const lastLine = lines[lines.length - 2] || lines[lines.length - 1];
          
          if (lastLine && lastLine[3] === ' ') {
            clearTimeout(timeout);
            socket.removeAllListeners('data');
            this.log(`< ${response.trim()}`);
            
            if (response.startsWith(expectedCode)) {
              resolve(response);
            } else {
              reject(new Error(`Unexpected SMTP response: ${response.trim()}`));
            }
          }
        }
      };

      socket.on('data', onData);
    });
  }

  async testConnection(config: SmtpConfig): Promise<{ success: boolean; message: string; logs: string }> {
    this.logs = [];
    this.log(`Testing connection to ${config.smtpHost}:${config.smtpPort} (Encryption: ${config.smtpEncryption})`);

    let socket: net.Socket | tls.TLSSocket | null = null;

    try {
      // Create connection
      if (config.smtpEncryption === 'ssl') {
        socket = tls.connect({
          host: config.smtpHost,
          port: config.smtpPort,
          rejectUnauthorized: false, // Allow self-signed certificates
        });
      } else {
        socket = net.createConnection({
          host: config.smtpHost,
          port: config.smtpPort,
        });
      }

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        socket!.on('connect', () => resolve());
        socket!.on('error', (err) => reject(err));
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      // Read initial greeting
      await this.sendCommand(socket, '', '220');

      // Send EHLO
      const hostname = process.env.HOSTNAME || 'localhost';
      await this.sendCommand(socket, `EHLO ${hostname}`, '250');

      // STARTTLS if needed
      if (config.smtpEncryption === 'tls') {
        await this.sendCommand(socket, 'STARTTLS', '220');
        
        // Upgrade to TLS
        const tlsSocket = tls.connect({
          socket: socket as net.Socket,
          host: config.smtpHost,
          rejectUnauthorized: false,
        });

        await new Promise<void>((resolve, reject) => {
          tlsSocket.on('secureConnect', () => resolve());
          tlsSocket.on('error', (err) => reject(err));
          setTimeout(() => reject(new Error('TLS handshake timeout')), 10000);
        });

        socket = tlsSocket;
        
        // Resend EHLO after TLS
        await this.sendCommand(socket, `EHLO ${hostname}`, '250');
      }

      // Authenticate if credentials provided
      if (config.smtpUser && config.smtpPass) {
        await this.sendCommand(socket, 'AUTH LOGIN', '334');
        await this.sendCommand(socket, Buffer.from(config.smtpUser).toString('base64'), '334');
        await this.sendCommand(socket, Buffer.from(config.smtpPass).toString('base64'), '235');
      }

      // QUIT
      await this.sendCommand(socket, 'QUIT', '221');

      socket.end();
      
      return {
        success: true,
        message: 'Connection and Authentication successful!',
        logs: this.logs.join('\n'),
      };
    } catch (error: any) {
      if (socket) {
        try {
          socket.end();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      const errorMessage = error.message || 'Unknown error';
      this.log(`Error: ${errorMessage}`);
      
      return {
        success: false,
        message: `SMTP Test Failed: ${errorMessage}`,
        logs: this.logs.join('\n'),
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config: SmtpConfig = {
      smtpHost: body.smtpHost || '',
      smtpPort: parseInt(body.smtpPort || '587', 10),
      smtpUser: body.smtpUser || '',
      smtpPass: body.smtpPass || '',
      smtpEncryption: (body.smtpEncryption || 'tls') as 'ssl' | 'tls' | 'none',
    };

    if (!config.smtpHost) {
      return NextResponse.json(
        { success: false, error: 'Host is required', logs: '' },
        { status: 400 }
      );
    }

    const tester = new SmtpTester();
    const result = await tester.testConnection(config);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.success ? undefined : result.message,
      logs: result.logs,
    });
  } catch (error: any) {
    console.error('Test SMTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test SMTP connection',
        logs: '',
      },
      { status: 500 }
    );
  }
}

