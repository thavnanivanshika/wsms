package com.wsms.service;

import com.wsms.model.EmailNotification;
import com.wsms.model.StationeryRequest;
import com.wsms.repository.EmailNotificationRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Sends notification e-mails to a person and (optionally) their superior, and records every
 * attempt in the {@code email_notifications} table. If SMTP is not configured, sends are
 * skipped (logged) so the workflow still succeeds.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final EmailNotificationRepository notificationRepository;
    private final String from;
    private final boolean enabled;

    public EmailService(JavaMailSender mailSender,
                        EmailNotificationRepository notificationRepository,
                        @Value("${wsms.mail.from}") String from,
                        @Value("${spring.mail.username:}") String username) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
        this.from = from;
        this.enabled = StringUtils.hasText(username);
        if (!enabled) {
            log.warn("SMTP not configured (spring.mail.username blank) - emails will be logged, not sent.");
        }
    }

    /** Send to the person and copy their superior if present; logs each to the DB. */
    public void notify(StationeryRequest request, String personEmail, String superiorEmail,
                       String subject, String body) {
        send(request, personEmail, subject, body);
        if (StringUtils.hasText(superiorEmail) && !superiorEmail.equalsIgnoreCase(personEmail)) {
            send(request, superiorEmail, subject, body);
        }
    }

    /** Convenience for non-request notifications (e.g. password change). */
    public void notify(String personEmail, String superiorEmail, String subject, String body) {
        notify(null, personEmail, superiorEmail, subject, body);
    }

    public void send(StationeryRequest request, String to, String subject, String body) {
        if (!StringUtils.hasText(to)) {
            return;
        }
        String status;
        if (!enabled) {
            log.info("[EMAIL skipped] to={} subject={}", to, subject);
            status = EmailNotification.SKIPPED;
        } else {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(from);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(body, false);
                mailSender.send(message);
                log.info("Email sent to {} - {}", to, subject);
                status = EmailNotification.SENT;
            } catch (Exception e) {
                log.error("Failed to send email to {} ({}): {}", to, subject, e.getMessage());
                status = EmailNotification.FAILED;
            }
        }
        notificationRepository.save(new EmailNotification(request, to, subject, status));
    }
}
