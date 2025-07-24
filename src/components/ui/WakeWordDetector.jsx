import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';

const WakeWordDetector = ({ onWakeWordDetected }) => {
  const [model, setModel] = useState(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  // Load the model
  useEffect(() => {
    async function loadModel() {
      try {
        console.log('Initializing TensorFlow.js backends...');
        await tf.setBackend('webgl'); // Try WebGL backend first
        await tf.ready();            // Ensure the backend is ready
        console.log('WebGL backend initialized successfully.');

        console.log('Loading speech commands model...');
        const recognizer = speechCommands.create('BROWSER_FFT');
        await recognizer.ensureModelLoaded();
        console.log('Model loaded successfully');
        
        // Log available words
        console.log('Available words:', recognizer.wordLabels());
        
        setModel(recognizer);
      } catch (err) {
        console.error('Failed to load model:', err);
        setError('Failed to load wake word detection model');
      }
    }
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (model) {
        console.log('Stopping listening...');
        model.stopListening();
      }
    };
  }, []);

  // Start listening when model is loaded
  useEffect(() => {
    if (model && !listening) {
      console.log('Model loaded, starting to listen...');
      startListening();
    }
  }, [model, listening]);

  const startListening = async () => {
    if (!model) {
      console.log('Cannot start listening, model not loaded');
      return;
    }

    try {
      console.log('Starting continuous listening...');
      
      await model.listen(
        result => {
          // Get the word with highest probability
          const { scores } = result;
          const wordLabels = model.wordLabels();
          
          // Find top 3 words for debugging
          const indexedScores = wordLabels.map((word, i) => ({word, score: scores[i]}));
          const sortedScores = [...indexedScores].sort((a, b) => b.score - a.score);
          const top3 = sortedScores.slice(0, 3);
          
          console.log('Top detections:', 
            top3.map(x => `${x.word}:${x.score.toFixed(2)}`).join(', ')
          );
          
          // Find the word with highest score
          let maxScore = 0;
          let detectedWord = '';
          
          for (let i = 0; i < scores.length; i++) {
            if (scores[i] > maxScore) {
              maxScore = scores[i];
              detectedWord = wordLabels[i];
            }
          }
          
          console.log(`Top detected word: ${detectedWord}, Score: ${maxScore.toFixed(3)}`);
          
          // Check if "go" was detected with high confidence
          if (detectedWord === 'go' && maxScore > 0.8) {
            console.log('✅ WAKE WORD DETECTED! Activating assistant...');
            onWakeWordDetected();
          }
        },
        {
          includeSpectrogram: false,
          probabilityThreshold: 0.75,
          invokeCallbackOnNoiseAndUnknown: false,
          overlapFactor: 0.5
        }
      );
      
      console.log('Listening started successfully');
      setListening(true);
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start voice detection');
    }
  };

  return (
    <div className="wake-word-detector p-3 bg-gray-100 rounded-lg mb-4">
      {error && <p className="error text-red-500">{error}</p>}
      <p className="text-sm">
        {listening 
          ? "🎤 Listening for wake word ('go')..." 
          : model 
            ? "⏳ Loading speech recognition..." 
            : "🔄 Initializing..."}
      </p>
    </div>
  );
};

export default WakeWordDetector;