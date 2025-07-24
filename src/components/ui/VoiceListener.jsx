import React, { useState, useEffect, useRef } from 'react';
import WakeWordDetector from './WakeWordDetector';

const VoiceListener = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Handle wake word detection
  const handleWakeWordDetected = () => {
    setWakeWordDetected(true);
    startListeningForCommands();
    
    // Visual/audio feedback that wake word was detected
    // This could be a sound effect or visual indicator
    console.log("Wake word 'Okay Chef' detected!");
  };

  // Start listening for commands after wake word is detected
  const startListeningForCommands = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      // Using the Web Speech API for command recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
        console.log('Listening for command...');
      };
      
      recognitionRef.current.onresult = (event) => {
        const command = event.results[0][0].transcript;
        setTranscript(command);
        console.log('Command received:', command);
        onCommand(command);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setWakeWordDetected(false);
        console.log('Command listening ended');
      };
      
      recognitionRef.current.start();
      
      // Set timeout to stop listening if no command is received
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 5000); // Stop after 5 seconds if no command
      
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
    }
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="voice-listener">
      {/* Always active wake word detector */}
      <WakeWordDetector onWakeWordDetected={handleWakeWordDetected} />
      
      {/* Status display */}
      <div className="status">
        {wakeWordDetected && (
          <div className="listening-status">
            {isListening ? 'Listening for your cooking command...' : 'Processing...'}
          </div>
        )}
        {transcript && (
          <div className="transcript">
            <strong>You said:</strong> {transcript}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceListener;