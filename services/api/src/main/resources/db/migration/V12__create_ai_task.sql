CREATE TABLE ai_task (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    input_data JSON NOT NULL,
    result_data JSON NULL,
    error_message VARCHAR(1000) NULL,
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_time DATETIME NULL,
    finished_time DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_ai_task_user_created (user_id, created_time),
    KEY idx_ai_task_status_created (status, created_time),
    CONSTRAINT fk_ai_task_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
