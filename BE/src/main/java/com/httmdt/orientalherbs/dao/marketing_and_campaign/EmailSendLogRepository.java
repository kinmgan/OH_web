package com.httmdt.orientalherbs.dao.marketing_and_campaign;

import com.httmdt.orientalherbs.model.marketing_and_campaign.EmailSendLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailSendLogRepository extends JpaRepository<EmailSendLog, Long> {
}
