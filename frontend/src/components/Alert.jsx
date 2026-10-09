import React from 'react';
import styles from './Alert.module.css'; // Import CSS module

const Alert = ({ message, onClose }) => {
    return (
        <div className={styles.alert}>
            <span>{message}</span>
            <button onClick={onClose}>X</button>
        </div>
    );
};

export default Alert;
