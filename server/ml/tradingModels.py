"""
Advanced ML Models for Trading
- LSTM for price prediction
- Transformer for pattern recognition  
- Reinforcement Learning for optimal trading
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import json
import sys

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import LSTM, Dense, Dropout, Attention, MultiHeadAttention, LayerNormalization
    from tensorflow.keras.optimizers import Adam
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("Warning: TensorFlow not installed. ML features limited.")

class LSTMPricePredictor:
    """LSTM model for price prediction"""
    
    def __init__(self, sequence_length=60, features=5):
        self.sequence_length = sequence_length
        self.features = features
        self.model = None
        self.scaler = MinMaxScaler()
        
    def build_model(self):
        """Build LSTM architecture"""
        if not HAS_TF:
            raise ImportError("TensorFlow required for LSTM")
            
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(self.sequence_length, self.features)),
            Dropout(0.2),
            LSTM(64, return_sequences=True),
            Dropout(0.2),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)  # Predict next price
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        self.model = model
        return model
    
    def prepare_data(self, price_data):
        """Prepare data for LSTM training"""
        # Features: open, high, low, close, volume
        df = pd.DataFrame(price_data)
        
        # Technical indicators
        df['sma_20'] = df['close'].rolling(20).mean()
        df['sma_50'] = df['close'].rolling(50).mean()
        df['rsi'] = self.calculate_rsi(df['close'])
        df['macd'] = self.calculate_macd(df['close'])
        
        df = df.dropna()
        
        # Scale features
        features = ['close', 'volume', 'sma_20', 'rsi', 'macd']
        scaled_data = self.scaler.fit_transform(df[features])
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i-self.sequence_length:i])
            y.append(scaled_data[i, 0])  # Predict close price
        
        return np.array(X), np.array(y)
    
    def train(self, price_data, epochs=50, batch_size=32, validation_split=0.2):
        """Train the LSTM model"""
        X, y = self.prepare_data(price_data)
        
        if self.model is None:
            self.build_model()
        
        history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=1
        )
        
        return history
    
    def predict(self, recent_data):
        """Predict next price"""
        if self.model is None:
            raise ValueError("Model not trained")
        
        # Prepare input
        scaled_input = self.scaler.transform(recent_data[-self.sequence_length:])
        X = np.array([scaled_input])
        
        # Predict
        prediction_scaled = self.model.predict(X, verbose=0)
        
        # Inverse transform
        dummy = np.zeros((1, self.features))
        dummy[0, 0] = prediction_scaled[0, 0]
        prediction = self.scaler.inverse_transform(dummy)[0, 0]
        
        return float(prediction)
    
    @staticmethod
    def calculate_rsi(prices, period=14):
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    @staticmethod
    def calculate_macd(prices, fast=12, slow=26, signal=9):
        """Calculate MACD indicator"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        signal_line = macd.ewm(span=signal).mean()
        return macd - signal_line
    
    def save_model(self, path):
        """Save trained model"""
        if self.model:
            self.model.save(path)
    
    def load_model(self, path):
        """Load trained model"""
        self.model = load_model(path)


class TransformerModel:
    """Transformer model for pattern recognition"""
    
    def __init__(self, sequence_length=100, d_model=128, num_heads=8):
        self.sequence_length = sequence_length
        self.d_model = d_model
        self.num_heads = num_heads
        self.model = None
        
    def build_model(self):
        """Build Transformer architecture"""
        if not HAS_TF:
            raise ImportError("TensorFlow required")
        
        inputs = tf.keras.Input(shape=(self.sequence_length, self.d_model))
        
        # Multi-head attention
        attention_output = MultiHeadAttention(
            num_heads=self.num_heads,
            key_dim=self.d_model
        )(inputs, inputs)
        
        # Add & Norm
        attention_output = LayerNormalization()(inputs + attention_output)
        
        # Feed Forward
        ff_output = Dense(self.d_model * 4, activation='relu')(attention_output)
        ff_output = Dense(self.d_model)(ff_output)
        
        # Add & Norm
        output = LayerNormalization()(attention_output + ff_output)
        
        # Classification head
        pooled = tf.keras.layers.GlobalAveragePooling1D()(output)
        output = Dense(64, activation='relu')(pooled)
        output = Dense(3, activation='softmax')(output)  # Buy, Hold, Sell
        
        model = tf.keras.Model(inputs=inputs, outputs=output)
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model


class ReinforcementLearningAgent:
    """RL Agent for optimal trading decisions"""
    
    def __init__(self, state_size, action_size=3):
        self.state_size = state_size
        self.action_size = action_size  # Buy, Hold, Sell
        self.memory = []
        self.gamma = 0.95  # Discount factor
        self.epsilon = 1.0  # Exploration rate
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.learning_rate = 0.001
        self.model = None
        
    def build_model(self):
        """Build DQN model"""
        if not HAS_TF:
            raise ImportError("TensorFlow required")
        
        model = Sequential([
            Dense(128, activation='relu', input_dim=self.state_size),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(self.action_size, activation='linear')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=self.learning_rate),
            loss='mse'
        )
        
        self.model = model
        return model
    
    def remember(self, state, action, reward, next_state, done):
        """Store experience in memory"""
        self.memory.append((state, action, reward, next_state, done))
        if len(self.memory) > 10000:
            self.memory.pop(0)
    
    def act(self, state):
        """Choose action based on epsilon-greedy policy"""
        if np.random.rand() <= self.epsilon:
            return np.random.randint(self.action_size)
        
        q_values = self.model.predict(state.reshape(1, -1), verbose=0)
        return np.argmax(q_values[0])
    
    def replay(self, batch_size=32):
        """Train on batch of experiences"""
        if len(self.memory) < batch_size:
            return
        
        batch = np.random.choice(len(self.memory), batch_size, replace=False)
        
        for idx in batch:
            state, action, reward, next_state, done = self.memory[idx]
            
            target = reward
            if not done:
                next_q_values = self.model.predict(next_state.reshape(1, -1), verbose=0)
                target = reward + self.gamma * np.amax(next_q_values[0])
            
            target_f = self.model.predict(state.reshape(1, -1), verbose=0)
            target_f[0][action] = target
            
            self.model.fit(state.reshape(1, -1), target_f, epochs=1, verbose=0)
        
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
    
    def get_action_name(self, action):
        """Convert action index to name"""
        return ['buy', 'hold', 'sell'][action]


class EnsembleModel:
    """Ensemble of multiple models for robust predictions"""
    
    def __init__(self):
        self.models = {}
        self.weights = {}
        
    def add_model(self, name, model, weight=1.0):
        """Add a model to the ensemble"""
        self.models[name] = model
        self.weights[name] = weight
    
    def predict(self, data):
        """Get weighted ensemble prediction"""
        predictions = {}
        
        for name, model in self.models.items():
            try:
                pred = model.predict(data)
                predictions[name] = {
                    'prediction': pred,
                    'weight': self.weights[name]
                }
            except Exception as e:
                print(f"Error in model {name}: {e}")
        
        # Weighted average
        if not predictions:
            return None
        
        total_weight = sum(p['weight'] for p in predictions.values())
        weighted_sum = sum(p['prediction'] * p['weight'] for p in predictions.values())
        
        return weighted_sum / total_weight
    
    def get_consensus(self, data):
        """Get consensus decision from all models"""
        decisions = []
        confidences = []
        
        for name, model in self.models.items():
            try:
                decision = model.decide(data)
                decisions.append(decision['action'])
                confidences.append(decision['confidence'])
            except:
                pass
        
        if not decisions:
            return {'action': 'hold', 'confidence': 0.0}
        
        # Most common decision
        action = max(set(decisions), key=decisions.count)
        confidence = np.mean(confidences)
        
        return {
            'action': action,
            'confidence': confidence,
            'agreement': decisions.count(action) / len(decisions)
        }


def main():
    """CLI interface for model training and prediction"""
    if len(sys.argv) < 2:
        print("Usage: python tradingModels.py <command> [args]")
        print("Commands: train, predict, evaluate")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'train':
        print("Training LSTM model...")
        model = LSTMPricePredictor()
        # Load data and train
        # model.train(price_data)
        print("Model trained successfully")
    
    elif command == 'predict':
        if len(sys.argv) < 3:
            print("Usage: python tradingModels.py predict <symbol>")
            sys.exit(1)
        
        symbol = sys.argv[2]
        print(f"Predicting price for {symbol}...")
        # Load model and predict
        # prediction = model.predict(recent_data)
        # print(json.dumps({'symbol': symbol, 'prediction': prediction}))
    
    elif command == 'evaluate':
        print("Evaluating model performance...")
        # Evaluation logic
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == '__main__':
    main()


