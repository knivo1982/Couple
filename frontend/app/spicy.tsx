import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { challengeAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function SpicyScreen() {
  const { user } = useStore();
  const [suggestions, setSuggestions] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'challenges' | 'positions' | 'quiz'>('challenges');
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suggestionsData, challengesData] = await Promise.all([
        challengeAPI.getSuggestions(),
        user?.couple_code ? challengeAPI.getAll(user.couple_code) : Promise.resolve([]),
      ]);
      setSuggestions(suggestionsData);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const addChallenge = async (challenge: any) => {
    if (!user?.couple_code) {
      Alert.alert('Errore', 'Devi essere in una coppia per aggiungere sfide');
      return;
    }

    try {
      await challengeAPI.add(
        user.couple_code,
        challenge.title,
        challenge.description,
        challenge.category
      );
      await loadData();
      Alert.alert('Aggiunto!', 'Sfida aggiunta alla vostra lista');
    } catch (error) {
      console.error('Error adding challenge:', error);
    }
  };

  const completeChallenge = async (challengeId: string) => {
    try {
      await challengeAPI.complete(challengeId);
      await loadData();
      Alert.alert('Complimenti!', 'Sfida completata!');
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const startQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setQuizModalVisible(true);
  };

  const answerQuestion = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < (suggestions?.quiz_questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const getCompatibilityScore = () => {
    // Simple scoring - in reality would compare with partner's answers
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    return score;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'romantic':
        return '#ff6b8a';
      case 'spicy':
        return '#ff4757';
      case 'adventure':
        return '#ffa502';
      default:
        return '#888';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return '#2ed573';
      case 'medio':
        return '#ffa502';
      case 'difficile':
        return '#ff4757';
      default:
        return '#888';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Zona Piccante</Text>
        <Ionicons name="flame" size={28} color="#ff6b8a" />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'challenges' && styles.tabActive]}
          onPress={() => setSelectedTab('challenges')}
        >
          <Ionicons
            name="trophy"
            size={20}
            color={selectedTab === 'challenges' ? '#ff6b8a' : '#888'}
          />
          <Text style={[styles.tabText, selectedTab === 'challenges' && styles.tabTextActive]}>
            Sfide
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'positions' && styles.tabActive]}
          onPress={() => setSelectedTab('positions')}
        >
          <Ionicons
            name="body"
            size={20}
            color={selectedTab === 'positions' ? '#ff6b8a' : '#888'}
          />
          <Text style={[styles.tabText, selectedTab === 'positions' && styles.tabTextActive]}>
            Posizioni
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'quiz' && styles.tabActive]}
          onPress={() => setSelectedTab('quiz')}
        >
          <Ionicons
            name="help-circle"
            size={20}
            color={selectedTab === 'quiz' ? '#ff6b8a' : '#888'}
          />
          <Text style={[styles.tabText, selectedTab === 'quiz' && styles.tabTextActive]}>
            Quiz
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selectedTab === 'challenges' && (
          <>
            {/* Active Challenges */}
            {challenges.filter(c => !c.completed).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Le Vostre Sfide</Text>
                {challenges.filter(c => !c.completed).map((challenge) => (
                  <View key={challenge.id} style={styles.challengeCard}>
                    <View style={styles.challengeHeader}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getCategoryColor(challenge.category) },
                        ]}
                      >
                        <Text style={styles.categoryText}>{challenge.category}</Text>
                      </View>
                      <TouchableOpacity onPress={() => completeChallenge(challenge.id)}>
                        <Ionicons name="checkmark-circle" size={28} color="#2ed573" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sfide Suggerite</Text>
              {suggestions?.challenges?.map((challenge: any, index: number) => (
                <View key={index} style={styles.suggestionCard}>
                  <View style={styles.challengeHeader}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(challenge.category) },
                      ]}
                    >
                      <Text style={styles.categoryText}>{challenge.category}</Text>
                    </View>
                    <TouchableOpacity onPress={() => addChallenge(challenge)}>
                      <Ionicons name="add-circle" size={28} color="#ff6b8a" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {selectedTab === 'positions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggerimenti Posizioni</Text>
            {suggestions?.positions?.map((position: any, index: number) => (
              <View key={index} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionName}>{position.name}</Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(position.difficulty) },
                    ]}
                  >
                    <Text style={styles.difficultyText}>{position.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.positionDesc}>{position.description}</Text>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'quiz' && (
          <View style={styles.section}>
            <View style={styles.quizIntro}>
              <Ionicons name="heart-circle" size={60} color="#ff6b8a" />
              <Text style={styles.quizTitle}>Quiz di Compatibilità</Text>
              <Text style={styles.quizDesc}>
                Scopri quanto siete compatibili rispondendo a queste domande
              </Text>
              <TouchableOpacity style={styles.startQuizButton} onPress={startQuiz}>
                <Text style={styles.startQuizText}>Inizia il Quiz</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quiz Modal */}
      <Modal
        visible={quizModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setQuizModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quizModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQuizModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            {!showResults ? (
              <>
                <Text style={styles.questionNumber}>
                  Domanda {currentQuestion + 1}/{suggestions?.quiz_questions?.length || 0}
                </Text>
                <Text style={styles.questionText}>
                  {suggestions?.quiz_questions?.[currentQuestion]?.question}
                </Text>
                <View style={styles.optionsContainer}>
                  {suggestions?.quiz_questions?.[currentQuestion]?.options?.map(
                    (option: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.optionButton}
                        onPress={() => answerQuestion(index)}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </>
            ) : (
              <View style={styles.resultsContainer}>
                <Ionicons name="heart" size={60} color="#ff6b8a" />
                <Text style={styles.resultsTitle}>Risultato</Text>
                <Text style={styles.resultsScore}>{getCompatibilityScore()}%</Text>
                <Text style={styles.resultsText}>
                  Siete una coppia molto compatibile!
                </Text>
                <TouchableOpacity
                  style={styles.closeResultsButton}
                  onPress={() => setQuizModalVisible(false)}
                >
                  <Text style={styles.closeResultsText}>Chiudi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#ff6b8a',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a5e',
    borderStyle: 'dashed',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 14,
    color: '#888',
  },
  positionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  positionDesc: {
    fontSize: 14,
    color: '#888',
  },
  quizIntro: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  quizDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  startQuizText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  quizModal: {
    backgroundColor: '#2a2a4e',
    borderRadius: 24,
    padding: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  questionNumber: {
    color: '#ff6b8a',
    fontSize: 14,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  resultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultsTitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 16,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff6b8a',
    marginVertical: 16,
  },
  resultsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  closeResultsButton: {
    backgroundColor: '#ff6b8a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  closeResultsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
