import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { 
  challengeAPI, 
  loveDiceAPI, 
  wishlistAPI, 
  quizAPI, 
  specialDatesAPI, 
  weeklyAPI 
} from '../services/api';

const { width } = Dimensions.get('window');

export default function SpicyScreen() {
  const { user } = useStore();
  const [suggestions, setSuggestions] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'dice' | 'challenges' | 'wishlist' | 'quiz' | 'countdown'>('dice');
  
  // Love Dice state
  const [diceResult, setDiceResult] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceAnimation] = useState(new Animated.Value(0));
  
  // Weekly Challenge
  const [weeklyChallenge, setWeeklyChallenge] = useState<any>(null);
  
  // Wishlist state
  const [wishlistData, setWishlistData] = useState<any>(null);
  const [wishModalVisible, setWishModalVisible] = useState(false);
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishDesc, setNewWishDesc] = useState('');
  const [newWishCategory, setNewWishCategory] = useState('romantic');
  
  // Quiz state
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  
  // Countdown state
  const [specialDates, setSpecialDates] = useState<any>(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [newDateTitle, setNewDateTitle] = useState('');
  const [newDateDate, setNewDateDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.couple_code) return;
    
    try {
      const [suggestionsData, challengesData, weekly] = await Promise.all([
        challengeAPI.getSuggestions(),
        challengeAPI.getAll(user.couple_code),
        weeklyAPI.get(user.couple_code),
      ]);
      setSuggestions(suggestionsData);
      setChallenges(challengesData);
      setWeeklyChallenge(weekly);
      
      // Load wishlist
      const wishlist = await wishlistAPI.get(user.couple_code, user.id);
      setWishlistData(wishlist);
      
      // Load quiz results
      const quiz = await quizAPI.getResults(user.couple_code);
      setQuizResults(quiz);
      
      // Load special dates
      const dates = await specialDatesAPI.getAll(user.couple_code);
      setSpecialDates(dates);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Love Dice functions
  const rollDice = async () => {
    setIsRolling(true);
    
    // Animation
    Animated.sequence([
      Animated.timing(diceAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(diceAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
    
    try {
      const result = await loveDiceAPI.roll();
      setTimeout(() => {
        setDiceResult(result);
        setIsRolling(false);
      }, 400);
    } catch (error) {
      setIsRolling(false);
      Alert.alert('Errore', 'Impossibile tirare i dadi');
    }
  };

  // Weekly Challenge
  const completeWeeklyChallenge = async () => {
    if (!user?.couple_code) return;
    try {
      await weeklyAPI.complete(user.couple_code);
      Alert.alert('Complimenti!', 'Sfida settimanale completata!');
      loadData();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile completare la sfida');
    }
  };

  // Wishlist functions
  const addWish = async () => {
    if (!newWishTitle.trim() || !user?.couple_code) return;
    
    try {
      await wishlistAPI.add(
        user.couple_code,
        user.id,
        newWishTitle.trim(),
        newWishDesc.trim(),
        newWishCategory
      );
      setWishModalVisible(false);
      setNewWishTitle('');
      setNewWishDesc('');
      loadData();
      Alert.alert('Aggiunto!', 'Il tuo desiderio è stato aggiunto alla wishlist segreta');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiungere il desiderio');
    }
  };

  // Quiz functions
  const startQuiz = () => {
    setCurrentQuestion(0);
    setShowQuizResults(false);
    setQuizModalVisible(true);
  };

  const answerQuestion = async (answerIndex: number) => {
    if (!user?.couple_code || !suggestions?.quiz_questions) return;
    
    try {
      await quizAPI.saveAnswer(
        user.couple_code,
        user.id,
        suggestions.quiz_questions[currentQuestion].id,
        answerIndex
      );
      
      if (currentQuestion < suggestions.quiz_questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Quiz completed, fetch results
        const results = await quizAPI.getResults(user.couple_code);
        setQuizResults(results);
        setShowQuizResults(true);
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare la risposta');
    }
  };

  // Countdown functions
  const addSpecialDate = async () => {
    if (!newDateTitle.trim() || !newDateDate.trim() || !user?.couple_code) return;
    
    try {
      await specialDatesAPI.create(
        user.couple_code,
        newDateTitle.trim(),
        newDateDate.trim(),
        user.id
      );
      setDateModalVisible(false);
      setNewDateTitle('');
      setNewDateDate('');
      loadData();
      Alert.alert('Aggiunto!', 'Appuntamento speciale creato');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile creare l\'appuntamento');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'romantic': return '#ff6b8a';
      case 'spicy': return '#ff4757';
      case 'adventure': return '#ffa502';
      case 'fantasy': return '#9b59b6';
      default: return '#888';
    }
  };

  const diceRotation = diceAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {[
            { key: 'dice', icon: 'dice', label: 'Dado' },
            { key: 'challenges', icon: 'trophy', label: 'Sfide' },
            { key: 'wishlist', icon: 'heart', label: 'Wishlist' },
            { key: 'quiz', icon: 'help-circle', label: 'Quiz' },
            { key: 'countdown', icon: 'time', label: 'Countdown' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={selectedTab === tab.key ? '#ff6b8a' : '#888'}
              />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* LOVE DICE TAB */}
        {selectedTab === 'dice' && (
          <View style={styles.diceSection}>
            <Text style={styles.sectionTitle}>Dado dell'Amore</Text>
            <Text style={styles.sectionSubtitle}>Tira i dadi e scopri cosa fare!</Text>
            
            <Animated.View style={[styles.diceContainer, { transform: [{ rotate: diceRotation }] }]}>
              <TouchableOpacity style={styles.diceButton} onPress={rollDice} disabled={isRolling}>
                <Ionicons name="dice" size={80} color="#fff" />
                <Text style={styles.diceButtonText}>{isRolling ? 'Tiro...' : 'TIRA!'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {diceResult && (
              <View style={styles.diceResultCard}>
                <Text style={styles.diceResultLabel}>Il dado dice:</Text>
                <Text style={styles.diceResultAction}>{diceResult.action}</Text>
                <Text style={styles.diceResultBodyPart}>{diceResult.body_part}</Text>
                <Text style={styles.diceResultDuration}>{diceResult.duration}</Text>
              </View>
            )}

            {/* Weekly Challenge */}
            {weeklyChallenge && (
              <View style={styles.weeklyCard}>
                <View style={styles.weeklyHeader}>
                  <Ionicons name="calendar" size={24} color="#ffd700" />
                  <Text style={styles.weeklyTitle}>Sfida della Settimana</Text>
                </View>
                <Text style={styles.weeklyChallengeTitle}>{weeklyChallenge.challenge.title}</Text>
                <Text style={styles.weeklyChallengeDesc}>{weeklyChallenge.challenge.description}</Text>
                {!weeklyChallenge.completed ? (
                  <TouchableOpacity style={styles.weeklyButton} onPress={completeWeeklyChallenge}>
                    <Text style={styles.weeklyButtonText}>Completata!</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.weeklyCompleted}>
                    <Ionicons name="checkmark-circle" size={24} color="#2ed573" />
                    <Text style={styles.weeklyCompletedText}>Completata questa settimana!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* CHALLENGES TAB */}
        {selectedTab === 'challenges' && (
          <>
            {challenges.filter(c => !c.completed).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Le Vostre Sfide</Text>
                {challenges.filter(c => !c.completed).map((challenge) => (
                  <View key={challenge.id} style={styles.challengeCard}>
                    <View style={styles.challengeHeader}>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(challenge.category) }]}>
                        <Text style={styles.categoryText}>{challenge.category}</Text>
                      </View>
                      <TouchableOpacity onPress={async () => {
                        await challengeAPI.complete(challenge.id);
                        loadData();
                      }}>
                        <Ionicons name="checkmark-circle" size={28} color="#2ed573" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sfide Suggerite</Text>
              {suggestions?.challenges?.slice(0, 6).map((challenge: any, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionCard}
                  onPress={async () => {
                    if (!user?.couple_code) return;
                    await challengeAPI.add(user.couple_code, challenge.title, challenge.description, challenge.category);
                    loadData();
                    Alert.alert('Aggiunta!', 'Sfida aggiunta alla vostra lista');
                  }}
                >
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(challenge.category) }]}>
                    <Text style={styles.categoryText}>{challenge.category}</Text>
                  </View>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  <Ionicons name="add-circle" size={24} color="#ff6b8a" style={styles.addIcon} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* WISHLIST TAB */}
        {selectedTab === 'wishlist' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wishlist Segreta</Text>
            <Text style={styles.sectionSubtitle}>
              Aggiungi desideri segreti. Se anche il partner lo vuole, si sblocca!
            </Text>

            {wishlistData?.partner_secret_wishes_count > 0 && (
              <View style={styles.secretHint}>
                <Ionicons name="lock-closed" size={20} color="#ff6b8a" />
                <Text style={styles.secretHintText}>
                  Il tuo partner ha {wishlistData.partner_secret_wishes_count} desideri segreti...
                </Text>
              </View>
            )}

            {/* Unlocked wishes */}
            {wishlistData?.unlocked_wishes?.length > 0 && (
              <View style={styles.unlockedSection}>
                <Text style={styles.unlockedTitle}>Desideri Sbloccati!</Text>
                {wishlistData.unlocked_wishes.map((wish: any) => (
                  <View key={wish.id} style={styles.unlockedCard}>
                    <Ionicons name="heart" size={24} color="#ff6b8a" />
                    <View style={styles.wishContent}>
                      <Text style={styles.wishTitle}>{wish.title}</Text>
                      <Text style={styles.wishDesc}>{wish.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* My wishes */}
            <Text style={styles.myWishesTitle}>I Miei Desideri</Text>
            {wishlistData?.my_wishes?.filter((w: any) => !w.unlocked).map((wish: any) => (
              <View key={wish.id} style={styles.wishCard}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(wish.category) }]}>
                  <Text style={styles.categoryText}>{wish.category}</Text>
                </View>
                <Text style={styles.wishTitle}>{wish.title}</Text>
                <Text style={styles.wishDesc}>{wish.description}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.addWishButton} onPress={() => setWishModalVisible(true)}>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addWishButtonText}>Aggiungi Desiderio</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QUIZ TAB */}
        {selectedTab === 'quiz' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz Compatibilità</Text>
            <Text style={styles.sectionSubtitle}>
              Rispondete entrambi e scoprite quanto siete in sintonia!
            </Text>

            {quizResults?.complete ? (
              <View style={styles.quizResultsCard}>
                <Text style={styles.quizScoreLabel}>Compatibilità</Text>
                <Text style={styles.quizScore}>{quizResults.compatibility_score}%</Text>
                <Text style={styles.quizInterpretation}>{quizResults.interpretation}</Text>
                <Text style={styles.quizMatches}>
                  {quizResults.matches}/{quizResults.total_questions} risposte uguali
                </Text>

                <View style={styles.comparisonsContainer}>
                  {quizResults.comparisons?.slice(0, 5).map((comp: any, index: number) => (
                    <View key={index} style={styles.comparisonItem}>
                      <Text style={styles.compQuestion}>{comp.question}</Text>
                      <View style={styles.compAnswers}>
                        <View style={[styles.compAnswer, comp.match && styles.compAnswerMatch]}>
                          <Text style={styles.compName}>{comp.user1_name}</Text>
                          <Text style={styles.compValue}>{comp.user1_answer}</Text>
                        </View>
                        <Ionicons 
                          name={comp.match ? "heart" : "close"} 
                          size={16} 
                          color={comp.match ? "#2ed573" : "#ff4757"} 
                        />
                        <View style={[styles.compAnswer, comp.match && styles.compAnswerMatch]}>
                          <Text style={styles.compName}>{comp.user2_name}</Text>
                          <Text style={styles.compValue}>{comp.user2_answer}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.retakeQuizButton} onPress={startQuiz}>
                  <Text style={styles.retakeQuizText}>Rifai il Quiz</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quizIntro}>
                <Ionicons name="heart-circle" size={80} color="#ff6b8a" />
                <Text style={styles.quizIntroText}>
                  {quizResults?.message || '12 domande per scoprire la vostra compatibilità'}
                </Text>
                <TouchableOpacity style={styles.startQuizButton} onPress={startQuiz}>
                  <Text style={styles.startQuizText}>Inizia il Quiz</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* COUNTDOWN TAB */}
        {selectedTab === 'countdown' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Countdown Romantico</Text>
            <Text style={styles.sectionSubtitle}>Pianifica le vostre serate speciali</Text>

            {specialDates?.next_date && (
              <View style={styles.countdownCard}>
                <Text style={styles.countdownLabel}>Prossimo Appuntamento</Text>
                <Text style={styles.countdownDays}>{specialDates.days_until_next}</Text>
                <Text style={styles.countdownDaysLabel}>giorni</Text>
                <Text style={styles.countdownTitle}>{specialDates.next_date.title}</Text>
                <Text style={styles.countdownDate}>{specialDates.next_date.date}</Text>
              </View>
            )}

            {specialDates?.upcoming?.slice(1).map((date: any) => (
              <View key={date.id} style={styles.upcomingCard}>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingTitle}>{date.title}</Text>
                  <Text style={styles.upcomingDate}>{date.date}</Text>
                </View>
                <TouchableOpacity onPress={async () => {
                  await specialDatesAPI.delete(date.id);
                  loadData();
                }}>
                  <Ionicons name="trash" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addDateButton} onPress={() => setDateModalVisible(true)}>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addDateButtonText}>Pianifica Serata</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Wishlist Modal */}
      <Modal visible={wishModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuovo Desiderio</Text>
              <TouchableOpacity onPress={() => setWishModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Titolo del desiderio"
              placeholderTextColor="#888"
              value={newWishTitle}
              onChangeText={setNewWishTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrizione (opzionale)"
              placeholderTextColor="#888"
              value={newWishDesc}
              onChangeText={setNewWishDesc}
              multiline
            />

            <Text style={styles.inputLabel}>Categoria</Text>
            <View style={styles.categoryPicker}>
              {['romantic', 'spicy', 'adventure', 'fantasy'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    newWishCategory === cat && { backgroundColor: getCategoryColor(cat) }
                  ]}
                  onPress={() => setNewWishCategory(cat)}
                >
                  <Text style={styles.categoryOptionText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={addWish}>
              <Text style={styles.saveButtonText}>Aggiungi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quiz Modal */}
      <Modal visible={quizModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.quizModal}>
            <TouchableOpacity style={styles.closeQuizButton} onPress={() => setQuizModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            {!showQuizResults && suggestions?.quiz_questions && (
              <>
                <Text style={styles.questionNumber}>
                  {currentQuestion + 1}/{suggestions.quiz_questions.length}
                </Text>
                <Text style={styles.questionText}>
                  {suggestions.quiz_questions[currentQuestion]?.question}
                </Text>
                <View style={styles.optionsContainer}>
                  {suggestions.quiz_questions[currentQuestion]?.options.map((option: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionButton}
                      onPress={() => answerQuestion(index)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {showQuizResults && (
              <View style={styles.quizDone}>
                <Ionicons name="checkmark-circle" size={60} color="#2ed573" />
                <Text style={styles.quizDoneText}>Quiz completato!</Text>
                <Text style={styles.quizDoneSubtext}>
                  {quizResults?.complete 
                    ? 'Guarda i risultati nel tab Quiz' 
                    : 'Aspetta che anche il partner completi il quiz'}
                </Text>
                <TouchableOpacity style={styles.closeQuizDoneButton} onPress={() => setQuizModalVisible(false)}>
                  <Text style={styles.closeQuizDoneText}>Chiudi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Modal */}
      <Modal visible={dateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuova Serata</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Titolo (es. Cena romantica)"
              placeholderTextColor="#888"
              value={newDateTitle}
              onChangeText={setNewDateTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Data (YYYY-MM-DD)"
              placeholderTextColor="#888"
              value={newDateDate}
              onChangeText={setNewDateDate}
            />

            <TouchableOpacity style={styles.saveButton} onPress={addSpecialDate}>
              <Text style={styles.saveButtonText}>Pianifica</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  tabsScroll: { maxHeight: 60 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#2a2a4e', borderRadius: 20, gap: 6 },
  tabActive: { backgroundColor: 'rgba(255, 107, 138, 0.2)' },
  tabText: { color: '#888', fontSize: 12 },
  tabTextActive: { color: '#ff6b8a' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  
  // Dice
  diceSection: { alignItems: 'center' },
  diceContainer: { marginVertical: 24 },
  diceButton: { width: 160, height: 160, borderRadius: 24, backgroundColor: '#ff6b8a', justifyContent: 'center', alignItems: 'center' },
  diceButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  diceResultCard: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%' },
  diceResultLabel: { color: '#888', fontSize: 14, marginBottom: 8 },
  diceResultAction: { color: '#ff6b8a', fontSize: 28, fontWeight: 'bold' },
  diceResultBodyPart: { color: '#fff', fontSize: 24, marginVertical: 4 },
  diceResultDuration: { color: '#ffa502', fontSize: 18, fontStyle: 'italic' },
  
  // Weekly
  weeklyCard: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 20, marginTop: 24, width: '100%', borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  weeklyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  weeklyTitle: { color: '#ffd700', fontSize: 14, fontWeight: '600' },
  weeklyChallengeTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  weeklyChallengeDesc: { color: '#888', fontSize: 14 },
  weeklyButton: { backgroundColor: '#ffd700', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  weeklyButtonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '600' },
  weeklyCompleted: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  weeklyCompletedText: { color: '#2ed573', fontSize: 14 },
  
  // Challenges
  challengeCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginBottom: 12 },
  suggestionCard: { backgroundColor: '#2a2a4e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#3a3a5e', borderStyle: 'dashed' },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryText: { color: '#fff', fontSize: 11, textTransform: 'capitalize' },
  challengeTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  challengeDesc: { color: '#888', fontSize: 13 },
  addIcon: { position: 'absolute', top: 16, right: 16 },
  
  // Wishlist
  secretHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 107, 138, 0.15)', padding: 12, borderRadius: 12, marginBottom: 16 },
  secretHintText: { color: '#ff6b8a', fontSize: 14, flex: 1 },
  unlockedSection: { marginBottom: 20 },
  unlockedTitle: { color: '#2ed573', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  unlockedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(46, 213, 115, 0.15)', padding: 16, borderRadius: 12, marginBottom: 8 },
  wishContent: { flex: 1 },
  myWishesTitle: { color: '#888', fontSize: 14, marginBottom: 12 },
  wishCard: { backgroundColor: '#2a2a4e', borderRadius: 12, padding: 16, marginBottom: 8 },
  wishTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 8 },
  wishDesc: { color: '#888', fontSize: 13, marginTop: 4 },
  addWishButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 16, borderRadius: 12, gap: 8, marginTop: 12 },
  addWishButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Quiz
  quizResultsCard: { backgroundColor: '#2a2a4e', borderRadius: 20, padding: 24, alignItems: 'center' },
  quizScoreLabel: { color: '#888', fontSize: 14 },
  quizScore: { color: '#ff6b8a', fontSize: 64, fontWeight: 'bold' },
  quizInterpretation: { color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 8 },
  quizMatches: { color: '#888', fontSize: 14, marginTop: 4 },
  comparisonsContainer: { marginTop: 20, width: '100%' },
  comparisonItem: { marginBottom: 16 },
  compQuestion: { color: '#888', fontSize: 12, marginBottom: 8 },
  compAnswers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compAnswer: { flex: 1, backgroundColor: '#1a1a2e', padding: 8, borderRadius: 8, alignItems: 'center' },
  compAnswerMatch: { backgroundColor: 'rgba(46, 213, 115, 0.15)' },
  compName: { color: '#888', fontSize: 10 },
  compValue: { color: '#fff', fontSize: 12, fontWeight: '600' },
  retakeQuizButton: { backgroundColor: '#3a3a5e', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginTop: 20 },
  retakeQuizText: { color: '#fff', fontSize: 14 },
  quizIntro: { alignItems: 'center', paddingVertical: 40 },
  quizIntroText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  startQuizButton: { backgroundColor: '#ff6b8a', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12 },
  startQuizText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Countdown
  countdownCard: { backgroundColor: '#2a2a4e', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20 },
  countdownLabel: { color: '#888', fontSize: 14 },
  countdownDays: { color: '#ff6b8a', fontSize: 80, fontWeight: 'bold', lineHeight: 90 },
  countdownDaysLabel: { color: '#ff6b8a', fontSize: 18 },
  countdownTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginTop: 16 },
  countdownDate: { color: '#888', fontSize: 14, marginTop: 4 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', padding: 16, borderRadius: 12, marginBottom: 8 },
  upcomingInfo: { flex: 1 },
  upcomingTitle: { color: '#fff', fontSize: 15, fontWeight: '500' },
  upcomingDate: { color: '#888', fontSize: 13 },
  addDateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b8a', padding: 16, borderRadius: 12, gap: 8, marginTop: 12 },
  addDateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2a2a4e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#3a3a5e' },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputLabel: { color: '#888', fontSize: 14, marginBottom: 8 },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#3a3a5e' },
  categoryOptionText: { color: '#fff', fontSize: 13, textTransform: 'capitalize' },
  saveButton: { backgroundColor: '#ff6b8a', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Quiz Modal
  quizModal: { backgroundColor: '#2a2a4e', borderRadius: 24, margin: 20, padding: 24, maxHeight: '80%' },
  closeQuizButton: { alignSelf: 'flex-end' },
  questionNumber: { color: '#ff6b8a', fontSize: 14, marginBottom: 8 },
  questionText: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 24 },
  optionsContainer: { gap: 12 },
  optionButton: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#3a3a5e' },
  optionText: { color: '#fff', fontSize: 16 },
  quizDone: { alignItems: 'center', paddingVertical: 40 },
  quizDoneText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  quizDoneSubtext: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8 },
  closeQuizDoneButton: { backgroundColor: '#ff6b8a', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, marginTop: 24 },
  closeQuizDoneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
