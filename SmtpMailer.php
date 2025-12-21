<?php
/**
 * Simple SMTP Mailer Class for PHP (No dependencies)
 * Supports SSL/TLS and SMTP Authentication
 */
class SmtpMailer {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $encryption; // 'none', 'ssl', 'tls' (STARTTLS)
    private $timeout = 10;
    private $logs = [];

    public function __construct($host, $port, $user, $pass, $encryption = 'tls') {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
        $this->encryption = strtolower($encryption);
    }

    private function getHostname() {
        return $_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost';
    }

    public function getLogs() {
        return implode("\n", $this->logs);
    }

    private function log($msg) {
        $this->logs[] = date('Y-m-d H:i:s') . ': ' . trim($msg);
    }

    public function send($to, $subject, $body, $headers = []) {
        $this->log("Starting connection to {$this->host}:{$this->port} (Encryption: {$this->encryption})");
        try {
            $prefix = ($this->encryption === 'ssl') ? 'ssl://' : '';
            $socket = @fsockopen($prefix . $this->host, $this->port, $errno, $errstr, $this->timeout);

            if (!$socket) {
                throw new Exception("Could not connect to {$this->host}:{$this->port} ($errno: $errstr)");
            }

            $this->getResponse($socket, '220');

            // EHLO
            $this->sendCommand($socket, "EHLO " . $this->getHostname(), '250');

            // STARTTLS
            if ($this->encryption === 'tls') {
                $this->sendCommand($socket, "STARTTLS", '220');
                
                // Set crypto method dynamically for better compatibility
                $crypto_method = STREAM_CRYPTO_METHOD_TLS_CLIENT;
                if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                    $crypto_method |= STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
                }

                if (!stream_socket_enable_crypto($socket, true, $crypto_method)) {
                    throw new Exception("Failed to start TLS encryption");
                }
                // Resend EHLO after TLS
                $this->sendCommand($socket, "EHLO " . $this->getHostname(), '250');
            }

            // Auth
            if ($this->user && $this->pass) {
                $this->sendCommand($socket, "AUTH LOGIN", '334');
                $this->sendCommand($socket, base64_encode($this->user), '334');
                $this->sendCommand($socket, base64_encode($this->pass), '235');
            }

            // Mail From / To
            $this->sendCommand($socket, "MAIL FROM:<{$this->user}>", '250');
            $this->sendCommand($socket, "RCPT TO:<$to>", '250');

            // DATA
            $this->sendCommand($socket, "DATA", '354');
            
            $headerStr = "";
            if (!isset($headers['To'])) $headerStr .= "To: $to\r\n";
            if (!isset($headers['Subject'])) $headerStr .= "Subject: $subject\r\n";
            foreach ($headers as $k => $v) {
                $headerStr .= "$k: $v\r\n";
            }
            
            $fullMessage = $headerStr . "\r\n" . $body . "\r\n.";
            $this->sendCommand($socket, $fullMessage, '250');

            // QUIT
            $this->sendCommand($socket, "QUIT", '221');
            fclose($socket);

            return true;
        } catch (Exception $e) {
            $this->log("Error: " . $e->getMessage());
            if (isset($socket) && is_resource($socket)) fclose($socket);
            throw $e;
        }
    }

    private function sendCommand($socket, $command, $expectedResponse) {
        $this->log("> " . (strpos($command, 'AUTH') === false && strpos($command, 'PASS') === false ? $command : "CONFIDENTIAL"));
        fputs($socket, $command . "\r\n");
        return $this->getResponse($socket, $expectedResponse);
    }

    private function getResponse($socket, $expectedResponse) {
        $response = "";
        stream_set_timeout($socket, $this->timeout);
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
            
            $info = stream_get_meta_data($socket);
            if ($info['timed_out']) throw new Exception("SMTP response timeout");
        }
        $this->log("< " . $response);
        if (strpos($response, (string)$expectedResponse) !== 0) {
            throw new Exception("Unexpected SMTP response: " . $response);
        }
        return $response;
    }

    public function testConnection() {
        $this->log("Testing connection to {$this->host}:{$this->port} (Encryption: {$this->encryption})");
        try {
            $prefix = ($this->encryption === 'ssl') ? 'ssl://' : '';
            $socket = @fsockopen($prefix . $this->host, $this->port, $errno, $errstr, $this->timeout);
            if (!$socket) throw new Exception("Connect failed: $errstr ($errno)");
            
            $this->getResponse($socket, '220');
            $this->sendCommand($socket, "EHLO " . $this->getHostname(), '250');

            if ($this->encryption === 'tls') {
                $this->sendCommand($socket, "STARTTLS", '220');
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new Exception("TLS failed");
                }
                $this->sendCommand($socket, "EHLO " . $this->getHostname(), '250');
            }

            if ($this->user && $this->pass) {
                $this->sendCommand($socket, "AUTH LOGIN", '334');
                $this->sendCommand($socket, base64_encode($this->user), '334');
                $this->sendCommand($socket, base64_encode($this->pass), '235');
            }

            $this->sendCommand($socket, "QUIT", '221');
            fclose($socket);
            return true;
        } catch (Exception $e) {
            if (isset($socket) && is_resource($socket)) fclose($socket);
            throw $e;
        }
    }
}
