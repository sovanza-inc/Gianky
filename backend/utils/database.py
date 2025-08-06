"""
Database utilities for storing user data, rewards, and transactions
"""

import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import os

logger = logging.getLogger(__name__)

class Database:
    """Database utility class for SQLite operations"""
    
    def __init__(self, database_url: str):
        # Extract database path from URL
        if database_url.startswith('sqlite:///'):
            self.db_path = database_url.replace('sqlite:///', '')
        else:
            self.db_path = 'gianky.db'  # Fallback
        
        # Ensure directory exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        return conn
    
    def init_tables(self):
        """Initialize database tables"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Users table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        wallet_address TEXT UNIQUE NOT NULL,
                        total_rewards INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Rewards table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS rewards (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        reward_id TEXT UNIQUE NOT NULL,
                        user_address TEXT NOT NULL,
                        reward_type TEXT NOT NULL,
                        reward_value TEXT NOT NULL,
                        game_session_id TEXT NOT NULL,
                        tx_hash TEXT,
                        reward_config TEXT,
                        status TEXT DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_address) REFERENCES users (wallet_address)
                    )
                ''')
                
                # Transactions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tx_hash TEXT UNIQUE NOT NULL,
                        user_address TEXT NOT NULL,
                        transaction_type TEXT NOT NULL,
                        status TEXT DEFAULT 'pending',
                        gas_used INTEGER,
                        gas_price INTEGER,
                        block_number INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_address) REFERENCES users (wallet_address)
                    )
                ''')
                
                # Game sessions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS game_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT UNIQUE NOT NULL,
                        user_address TEXT NOT NULL,
                        game_type TEXT DEFAULT 'wheel',
                        status TEXT DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMP,
                        FOREIGN KEY (user_address) REFERENCES users (wallet_address)
                    )
                ''')
                
                # Create indexes
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_wallet ON users (wallet_address)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards (user_address)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_rewards_session ON rewards (game_session_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_address)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions (tx_hash)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions (user_address)')
                
                conn.commit()
                logger.info("Database tables initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing database tables: {str(e)}")
            raise
    
    def get_or_create_user(self, wallet_address: str) -> Dict[str, Any]:
        """Get existing user or create new one"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Try to get existing user
                cursor.execute(
                    'SELECT * FROM users WHERE wallet_address = ?',
                    (wallet_address.lower(),)
                )
                user = cursor.fetchone()
                
                if user:
                    return dict(user)
                
                # Create new user
                cursor.execute('''
                    INSERT INTO users (wallet_address, total_rewards, created_at, updated_at)
                    VALUES (?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ''', (wallet_address.lower(),))
                
                # Get the created user
                cursor.execute(
                    'SELECT * FROM users WHERE wallet_address = ?',
                    (wallet_address.lower(),)
                )
                user = cursor.fetchone()
                
                conn.commit()
                logger.info(f"Created new user: {wallet_address}")
                return dict(user)
                
        except Exception as e:
            logger.error(f"Error getting/creating user: {str(e)}")
            raise
    
    def create_reward(self, reward_data: Dict[str, Any]) -> None:
        """Create a new reward record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO rewards (
                        reward_id, user_address, reward_type, reward_value,
                        game_session_id, tx_hash, reward_config, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    reward_data['reward_id'],
                    reward_data['user_address'].lower(),
                    reward_data['reward_type'],
                    reward_data['reward_value'],
                    reward_data['game_session_id'],
                    reward_data.get('tx_hash', ''),
                    reward_data.get('reward_config', '{}'),
                    reward_data.get('status', 'pending'),
                    reward_data.get('created_at', datetime.utcnow().isoformat())
                ))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error creating reward: {str(e)}")
            raise
    
    def get_user_rewards(self, user_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's rewards"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM rewards 
                    WHERE user_address = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                ''', (user_address.lower(), limit))
                
                rewards = cursor.fetchall()
                return [dict(reward) for reward in rewards]
                
        except Exception as e:
            logger.error(f"Error getting user rewards: {str(e)}")
            return []
    
    def get_user_rewards_since(self, user_address: str, since_time: datetime) -> List[Dict[str, Any]]:
        """Get user's rewards since a specific time"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM rewards 
                    WHERE user_address = ? AND created_at >= ?
                    ORDER BY created_at DESC
                ''', (user_address.lower(), since_time.isoformat()))
                
                rewards = cursor.fetchall()
                return [dict(reward) for reward in rewards]
                
        except Exception as e:
            logger.error(f"Error getting user rewards since time: {str(e)}")
            return []
    
    def get_reward_by_session(self, user_address: str, game_session_id: str) -> Optional[Dict[str, Any]]:
        """Get reward by game session"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM rewards 
                    WHERE user_address = ? AND game_session_id = ?
                ''', (user_address.lower(), game_session_id))
                
                reward = cursor.fetchone()
                return dict(reward) if reward else None
                
        except Exception as e:
            logger.error(f"Error getting reward by session: {str(e)}")
            return None
    
    def increment_user_rewards(self, user_address: str) -> None:
        """Increment user's total rewards count"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE users 
                    SET total_rewards = total_rewards + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE wallet_address = ?
                ''', (user_address.lower(),))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error incrementing user rewards: {str(e)}")
    
    def create_transaction(self, tx_data: Dict[str, Any]) -> None:
        """Create transaction record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO transactions (
                        tx_hash, user_address, transaction_type, status,
                        gas_used, gas_price, block_number, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    tx_data['tx_hash'],
                    tx_data['user_address'].lower(),
                    tx_data.get('transaction_type', 'unknown'),
                    tx_data.get('status', 'pending'),
                    tx_data.get('gas_used', 0),
                    tx_data.get('gas_price', 0),
                    tx_data.get('block_number', 0),
                    tx_data.get('created_at', datetime.utcnow().isoformat())
                ))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error creating transaction: {str(e)}")
    
    def create_game_session(self, session_data: Dict[str, Any]) -> None:
        """Create game session record"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO game_sessions (
                        session_id, user_address, game_type, status, created_at
                    ) VALUES (?, ?, ?, ?, ?)
                ''', (
                    session_data['session_id'],
                    session_data['user_address'].lower(),
                    session_data.get('game_type', 'wheel'),
                    session_data.get('status', 'active'),
                    session_data.get('created_at', datetime.utcnow().isoformat())
                ))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error creating game session: {str(e)}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get user count
                cursor.execute('SELECT COUNT(*) FROM users')
                user_count = cursor.fetchone()[0]
                
                # Get reward count
                cursor.execute('SELECT COUNT(*) FROM rewards')
                reward_count = cursor.fetchone()[0]
                
                # Get transaction count
                cursor.execute('SELECT COUNT(*) FROM transactions')
                transaction_count = cursor.fetchone()[0]
                
                # Get recent activity (last 24 hours)
                since_time = (datetime.utcnow() - timedelta(hours=24)).isoformat()
                cursor.execute('SELECT COUNT(*) FROM rewards WHERE created_at >= ?', (since_time,))
                recent_rewards = cursor.fetchone()[0]
                
                return {
                    'total_users': user_count,
                    'total_rewards': reward_count,
                    'total_transactions': transaction_count,
                    'recent_rewards_24h': recent_rewards
                }
                
        except Exception as e:
            logger.error(f"Error getting database stats: {str(e)}")
            return {
                'total_users': 0,
                'total_rewards': 0,
                'total_transactions': 0,
                'recent_rewards_24h': 0
            }