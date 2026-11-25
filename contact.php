<?php
/**
 * TOPA website contact handler.
 * Sends form submissions to the TOPA inbox using PHP mail(). Works on standard cPanel hosting.
 * If your host blocks mail(), the website automatically falls back to opening the visitor's email app.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$TO = 'info@topaorganicuganda.org';          // where messages are delivered
$FROM = 'website@topaorganicuganda.org';     // must be an address on this domain

function out($ok, $msg, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok, 'message' => $msg, 'error' => $ok ? null : $msg]); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 'Method not allowed', 405);
if (!empty($_POST['website'])) out(true, 'Thank you!');                       // honeypot: silently drop bots

$clean = function ($k, $max = 2000) { return trim(mb_substr(strip_tags((string)($_POST[$k] ?? '')), 0, $max)); };
$form    = $clean('form', 40);
$name    = $clean('name', 120);
$email   = filter_var($clean('email', 200), FILTER_VALIDATE_EMAIL);
$phone   = $clean('phone', 40);
$interest= $clean('interest', 80);
$subject = $clean('subject', 120);
$message = $clean('message', 5000);

if (!$email) out(false, 'Please enter a valid email address.', 422);
if ($form !== 'newsletter' && ($name === '' || $message === '')) out(false, 'Please fill in your name and message.', 422);

// Basic rate limit: one submission per 30 seconds per IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$f = sys_get_temp_dir() . '/topa_' . md5($ip);
if (file_exists($f) && time() - filemtime($f) < 30) out(false, 'Please wait a moment before sending again.', 429);
@touch($f);

$subj = $form === 'newsletter' ? 'Newsletter sign-up' : ('Website enquiry: ' . ($interest ?: $subject ?: 'General'));
$subj = str_replace(["\r", "\n"], '', $subj);
$body = "New message from topaorganicuganda.org\n\n"
      . "Form: $form\nName: $name\nEmail: $email\nPhone: $phone\nInterest: $interest\n\nMessage:\n$message\n\n"
      . "IP: $ip\nTime: " . date('c') . "\n";
$headers = "From: TOPA Website <$FROM>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\n";

if (@mail($TO, '=?UTF-8?B?' . base64_encode($subj) . '?=', $body, $headers)) {
  out(true, $form === 'newsletter' ? 'You’re subscribed. Thank you!' : 'Thank you! Your message has been sent. We’ll get back to you shortly.');
}
out(false, 'Mail could not be sent', 500);
