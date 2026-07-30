CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    avatar VARCHAR(500),
    level INT NOT NULL DEFAULT 1,
    experience BIGINT NOT NULL DEFAULT 0,
    mentor_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_time TIMESTAMP NOT NULL,
    updated_time TIMESTAMP NOT NULL
);

CREATE TABLE course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    cover_url VARCHAR(500),
    description VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL,
    level VARCHAR(30) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    teacher_name VARCHAR(50) NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL
);

CREATE TABLE course_lesson (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    video_url VARCHAR(500),
    duration VARCHAR(30) NOT NULL,
    sort INT NOT NULL,
    create_time TIMESTAMP NOT NULL
);

CREATE TABLE learning_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL,
    update_time TIMESTAMP NOT NULL,
    CONSTRAINT uk_learning_record_user_lesson UNIQUE (user_id, course_id, lesson_id)
);

CREATE TABLE ai_question_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    question VARCHAR(1000) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    create_time TIMESTAMP NOT NULL
);

CREATE TABLE ai_question_answer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    question VARCHAR(1000) NOT NULL,
    user_answer VARCHAR(500) NOT NULL,
    correct_answer VARCHAR(500) NOT NULL,
    correct BOOLEAN NOT NULL,
    create_time TIMESTAMP NOT NULL
);

CREATE TABLE ai_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    input_data CLOB NOT NULL,
    result_data CLOB,
    error_message VARCHAR(1000),
    created_time TIMESTAMP NOT NULL,
    started_time TIMESTAMP,
    finished_time TIMESTAMP,
    CONSTRAINT fk_ai_task_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE mentor_apply (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    apply_status VARCHAR(16) NOT NULL,
    create_time TIMESTAMP NOT NULL,
    update_time TIMESTAMP NOT NULL
);

CREATE TABLE mentor_contribution (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    experience_reward INT NOT NULL,
    create_time TIMESTAMP NOT NULL
);

CREATE TABLE game_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    config_json CLOB NOT NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT uk_game_task_task_version UNIQUE (task_id, version)
);

CREATE TABLE game_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_time TIMESTAMP NOT NULL,
    CONSTRAINT fk_game_session_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE game_event (
    event_id VARCHAR(64) PRIMARY KEY,
    session_id BIGINT NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    outcome_code VARCHAR(64) NOT NULL,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_event_session FOREIGN KEY (session_id) REFERENCES game_session (id)
);
