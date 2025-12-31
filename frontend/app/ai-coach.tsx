import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { usePremiumStore } from '../store/premiumStore';
import { aiCoachAPI } from '../services/api';

const { width } = Dimensions.get('window');

const generateLoveInsights = (data: any) => {
  const insights: any[] = [];
  const { intimacyEntries, stats } = data;
  
  if (intimacyEntries && intimacyEntries.length >= 5) {
    const weekendEntries = intimacyEntries.filter((e: any) => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6;
    });
    
    const weekendPct = (weekendEntries.length / intimacyEntries.length) * 100;
    
    if (weekendPct > 60) {
      insights.push({
        icon: '📅',
        title: 'Siete più sincronizzati nel weekend',
        value: `${Math.round(weekendPct)}%`,
        description: 'dei vostri momenti intimi avviene nel fine settimana',
        color: '#ff6b8a',
      });
    } else if (weekendPct < 40) {
      insights.push({
        icon: '🌙',
        title: 'Preferite i giorni feriali',
        value: `${Math.round(100 - weekendPct)}%`,
        description: 'dei vostri momenti intimi avviene durante la settimana',
        color: '#9b59b6',
      });
    }
    
    const locations: { [key: string]: number } = {};
    intimacyEntries.forEach((e: any) => {
      if (e.location) {
        locations[e.location] = (locations[e.location] || 0) + 1;
      }
    });
    
    const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];
    if (topLocation && topLocation[1] >= 3) {
      const locationNames: { [key: string]: string } = {
        bedroom: 'Camera da letto',
        shower: 'Doccia',
        couch: 'Divano',
        kitchen: 'Cucina',
        car: 'Auto',
        outdoor: "All'aperto",
        hotel: 'Hotel',
      };
      
      insights.push({
        icon: '📍',
        title: 'Il vostro posto preferito',
        value: locationNames[topLocation[0]] || topLocation[0],
        description: `${topLocation[1]} volte negli ultimi mesi`,
        color: '#f39c12',
      });
    }
  }
  
  if (stats) {
    if (stats.total_intimacy_logs > 0) {
      insights.push({
        icon: '❤️',
        title: 'Momenti insieme',
        value: stats.total_intimacy_logs.toString(),
        description: 'momenti intimi registrati',
        color: '#ff6b8a',
      });
    }
  }
  
  return insights;
};

export default function AICoachScreen() {
  const router = useRouter();
  const { user, intimacyEntries, stats } = useStore();
  const { isPremium } = usePremiumStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coach' | 'insights' | 'ask'>('coach');
  const [weeklyTip, setWeeklyTip] = useState<string>('');
  const [encouragement, setEncouragement] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'coach', message: string}>>([
    {role: 'coach', message: 'Ciao! Sono la tua coach di coppia 💕 Sono qui per aiutarti con qualsiasi domanda su relazione, intimità, comunicazione... Chiedimi pure!'}
  ]);
  
  // New state for enhanced features
  const [dailyMission, setDailyMission] = useState<any>(null);
  const [dateNightIdeas, setDateNightIdeas] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [missionCompleted, setMissionCompleted] = useState(false);

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    setIsLoading(true);
    try {
      if (user?.couple_code && user?.id) {
        // Load AI suggestions
        const response = await aiCoachAPI.analyze(
          user.couple_code,
          user.id,
          user.name,
          undefined
        );
        
        if (response.success && response.data) {
          setSuggestions(response.data.suggestions || []);
          setWeeklyTip(response.data.weekly_tip || '');
          setEncouragement(response.data.encouragement || '');
          
          // New enhanced data
          if (response.data.daily_mission) {
            setDailyMission(response.data.daily_mission);
          }
          if (response.data.date_night_ideas) {
            setDateNightIdeas(response.data.date_night_ideas);
          }
          if (response.data.badges) {
            setBadges(response.data.badges);
          }
        }
        
        // Load insights from server
        const insightsResponse = await aiCoachAPI.getInsights(user.couple_code);
        if (insightsResponse.success && insightsResponse.insights) {
          setInsights(insightsResponse.insights);
        }
      }
    } catch (error) {
      console.error('Error loading coach data:', error);
      // Fallback data
      setDailyMission({
        icon: '💕',
        title: 'Missione del Giorno',
        description: 'Scrivi 3 cose che ami del tuo partner e condividile con lui/lei',
        points: 50,
        difficulty: 'facile'
      });
      setDateNightIdeas([
        { icon: '🍿', title: 'Serata Film', description: 'Film + popcorn + coccole sul divano', time: '2-3 ore', budget: '€' },
        { icon: '🍳', title: 'Chef a Casa', description: 'Cucinate insieme un piatto nuovo', time: '1-2 ore', budget: '€€' },
      ]);
      setBadges([
        { icon: '🔥', title: 'Prima Scintilla', description: 'Primo momento registrato', unlocked: true },
        { icon: '📅', title: '7 Giorni', description: '7 giorni consecutivi', unlocked: false, progress: 3, total: 7 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCompleteMission = () => {
    setMissionCompleted(true);
    // Could send to backend to track points
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !user?.couple_code) return;
    
    const userMessage = question.trim();
    setQuestion('');
    Keyboard.dismiss();
    
    // Add user message to chat
    setChatMessages(prev => [...prev, {role: 'user', message: userMessage}]);
    setIsAskingQuestion(true);
    
    try {
      const response = await aiCoachAPI.askQuestion(userMessage, user.couple_code);
      if (response.success) {
        setChatMessages(prev => [...prev, {role: 'coach', message: response.answer}]);
      } else {
        setChatMessages(prev => [...prev, {role: 'coach', message: 'Mi dispiace, non riesco a rispondere ora. Riprova! 💕'}]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {role: 'coach', message: 'Errore di connessione. Riprova più tardi! 💕'}]);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff6b8a';
      case 'medium': return '#f39c12';
      case 'low': return '#2ed573';
      default: return '#888';
    }
  };

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>AI Coach</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.premiumGate}>
          <View style={styles.premiumIcon}>
            <Ionicons name="diamond" size={48} color="#f39c12" />
          </View>
          <Text style={styles.premiumTitle}>Funzione Premium</Text>
          <Text style={styles.premiumDesc}>
            L'AI Coach analizza i tuoi dati e ti dà suggerimenti personalizzati per migliorare la vostra relazione.
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/paywall')}
          >
            <Ionicons name="diamond" size={20} color="#fff" />
            <Text style={styles.upgradeText}>Sblocca Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'ask' && chatMessages.length > 1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages, activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>🧠 AI Coach</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'coach' && styles.tabActive]}
            onPress={() => setActiveTab('coach')}
          >
            <Ionicons name="bulb" size={18} color={activeTab === 'coach' ? '#ff6b8a' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'coach' && styles.tabTextActive]}>Consigli</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
            onPress={() => setActiveTab('insights')}
          >
            <Ionicons name="analytics" size={18} color={activeTab === 'insights' ? '#ff6b8a' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ask' && styles.tabActive]}
            onPress={() => setActiveTab('ask')}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={activeTab === 'ask' ? '#ff6b8a' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'ask' && styles.tabTextActive]}>Chiedi</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b8a" />
            <Text style={styles.loadingText}>L'AI sta analizzando i vostri dati...</Text>
          </View>
        ) : activeTab === 'ask' ? (
          /* CHAT TAB - Special layout with input outside ScrollView */
          <View style={styles.chatWrapper}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatScrollView}
              contentContainerStyle={styles.chatScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View style={styles.coachAvatar}>
                  <Text style={{ fontSize: 28 }}>👩‍⚕️</Text>
                </View>
                <View>
                  <Text style={styles.coachName}>Dr. Sofia - Coach di Coppia</Text>
                  <Text style={styles.coachStatus}>🟢 Online</Text>
                </View>
              </View>
              
              {/* Chat Messages */}
              <View style={styles.chatContainer}>
                {chatMessages.map((msg, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.chatBubble, 
                      msg.role === 'user' ? styles.userBubble : styles.coachBubble
                    ]}
                  >
                    {msg.role === 'coach' && (
                      <Text style={styles.bubbleAvatar}>👩‍⚕️</Text>
                    )}
                    <Text style={[
                      styles.chatText,
                      msg.role === 'user' ? styles.userText : styles.coachText
                    ]}>{msg.message}</Text>
                  </View>
                ))}
                {isAskingQuestion && (
                  <View style={[styles.chatBubble, styles.coachBubble]}>
                    <Text style={styles.bubbleAvatar}>👩‍⚕️</Text>
                    <ActivityIndicator color="#ff6b8a" size="small" />
                  </View>
                )}
              </View>
              
              {/* Quick Questions */}
              {chatMessages.length <= 2 && (
                <View style={styles.quickQuestions}>
                  {[
                    '💬 Comunicazione',
                    '🔥 Passione',
                    '😰 Stress',
                    '💕 Romanticismo'
                  ].map((q, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.quickQuestion}
                      onPress={() => setQuestion(
                        i === 0 ? 'Come migliorare la comunicazione?' :
                        i === 1 ? 'Come riaccendere la passione?' :
                        i === 2 ? 'Come gestire lo stress nella coppia?' :
                        'Come essere più romantici?'
                      )}
                    >
                      <Text style={styles.quickQuestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
            
            {/* Input - FIXED at bottom, outside ScrollView */}
            <View style={styles.chatInputWrapper}>
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Scrivi la tua domanda..."
                  placeholderTextColor="#666"
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                  maxLength={500}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, (!question.trim() || isAskingQuestion) && styles.sendButtonDisabled]}
                  onPress={handleAskQuestion}
                  disabled={!question.trim() || isAskingQuestion}
                >
                  <Ionicons name="send" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* OTHER TABS - Standard ScrollView */
          <ScrollView 
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'coach' ? (
              <>
                {/* 🎯 MISSIONE DEL GIORNO */}
                <View style={styles.missionCard}>
                  <View style={styles.missionHeader}>
                    <Text style={styles.missionEmoji}>🎯</Text>
                    <View style={styles.missionTitleContainer}>
                      <Text style={styles.missionTitle}>Missione del Giorno</Text>
                      {dailyMission?.difficulty && (
                        <View style={[styles.difficultyBadge, 
                          dailyMission.difficulty === 'facile' ? styles.difficultyEasy :
                          dailyMission.difficulty === 'medio' ? styles.difficultyMedium : styles.difficultyHard
                        ]}>
                          <Text style={styles.difficultyText}>{dailyMission.difficulty}</Text>
                        </View>
                      )}
                    </View>
                    {dailyMission?.points && (
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{dailyMission.points} pt</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.missionDescription}>
                    {dailyMission?.description || 'Scrivi 3 cose che ami del tuo partner e condividile con lui/lei'}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.missionButton, missionCompleted && styles.missionButtonCompleted]}
                    onPress={handleCompleteMission}
                    disabled={missionCompleted}
                  >
                    <Ionicons 
                      name={missionCompleted ? "checkmark-circle" : "flag"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.missionButtonText}>
                      {missionCompleted ? 'Completata!' : 'Segna come completata'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 💑 IDEE DATE NIGHT */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>💑</Text>
                    <Text style={styles.sectionTitle}>Idee Date Night</Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateNightScroll}
                  >
                    {(dateNightIdeas.length > 0 ? dateNightIdeas : [
                      { icon: '🍿', title: 'Serata Film', description: 'Film + popcorn + coccole', time: '2-3 ore', budget: '€' },
                      { icon: '🍳', title: 'Chef a Casa', description: 'Cucinate insieme un piatto nuovo', time: '1-2 ore', budget: '€€' },
                      { icon: '🌙', title: 'Sotto le Stelle', description: 'Picnic notturno romantico', time: '2 ore', budget: '€' },
                      { icon: '💆', title: 'Spa Casalinga', description: 'Massaggi e coccole reciproche', time: '1-2 ore', budget: '€' },
                    ]).map((idea, index) => (
                      <View key={index} style={styles.dateNightCard}>
                        <Text style={styles.dateNightIcon}>{idea.icon}</Text>
                        <Text style={styles.dateNightTitle}>{idea.title}</Text>
                        <Text style={styles.dateNightDesc}>{idea.description}</Text>
                        <View style={styles.dateNightMeta}>
                          <View style={styles.dateNightTag}>
                            <Ionicons name="time-outline" size={12} color="#888" />
                            <Text style={styles.dateNightTagText}>{idea.time}</Text>
                          </View>
                          <View style={styles.dateNightTag}>
                            <Text style={styles.dateNightTagText}>{idea.budget}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* 🏆 TRAGUARDI & BADGE */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>🏆</Text>
                    <Text style={styles.sectionTitle}>Traguardi</Text>
                  </View>
                  <View style={styles.badgesGrid}>
                    {(badges.length > 0 ? badges : [
                      { icon: '🔥', title: 'Prima Scintilla', description: 'Primo momento registrato', unlocked: true },
                      { icon: '📅', title: '7 Giorni', description: '7 giorni consecutivi', unlocked: false, progress: 3, total: 7 },
                      { icon: '💯', title: 'Perfezionisti', description: '5 momenti qualità 5/5', unlocked: false, progress: 2, total: 5 },
                      { icon: '🌍', title: 'Esploratori', description: '5 location diverse', unlocked: false, progress: 1, total: 5 },
                      { icon: '💕', title: 'Innamorati', description: '10 momenti totali', unlocked: false, progress: 4, total: 10 },
                      { icon: '🎉', title: 'Festaioli', description: 'Momento in data speciale', unlocked: false },
                    ]).map((badge, index) => (
                      <View 
                        key={index} 
                        style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}
                      >
                        <Text style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>
                          {badge.icon}
                        </Text>
                        <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>
                          {badge.title}
                        </Text>
                        <Text style={styles.badgeDesc}>{badge.description}</Text>
                        {!badge.unlocked && badge.progress !== undefined && (
                          <View style={styles.badgeProgress}>
                            <View style={styles.badgeProgressBar}>
                              <View 
                                style={[
                                  styles.badgeProgressFill, 
                                  { width: `${(badge.progress / badge.total) * 100}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.badgeProgressText}>{badge.progress}/{badge.total}</Text>
                          </View>
                        )}
                        {badge.unlocked && (
                          <View style={styles.unlockedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#2ed573" />
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Refresh Button */}
                <View style={styles.refreshCard}>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadCoachData}>
                    <Ionicons name="refresh" size={20} color="#ff6b8a" />
                    <Text style={styles.refreshText}>Aggiorna</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionIntro}>
                  Le statistiche intelligenti della vostra coppia ❤️
                </Text>
                
                <View style={styles.insightsGrid}>
                  {insights.map((insight, index) => (
                    <View 
                      key={index} 
                      style={[styles.insightCard, { borderColor: insight.color + '40' }]}
                    >
                      <Text style={styles.insightIcon}>{insight.icon}</Text>
                      <Text style={[styles.insightValue, { color: insight.color }]}>{insight.value}</Text>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <Text style={styles.insightDesc}>{insight.description}</Text>
                    </View>
                  ))}
                </View>
                
                {insights.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="analytics-outline" size={48} color="#555" />
                    <Text style={styles.emptyText}>
                      Registra più momenti insieme per sbloccare gli insights!
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#3a3a5e',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ff6b8a',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  encouragementCard: {
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 138, 0.3)',
  },
  encouragementText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionIntro: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestionCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  suggestionMessage: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
    marginBottom: 16,
  },
  suggestionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionActionText: {
    fontSize: 14,
    color: '#ff6b8a',
    fontWeight: '500',
  },
  weeklyTipCard: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  weeklyTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  weeklyTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f39c12',
  },
  weeklyTipText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  refreshCard: {
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 138, 0.15)',
    borderRadius: 12,
  },
  refreshText: {
    color: '#ff6b8a',
    fontSize: 14,
    fontWeight: '500',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    width: (width - 52) / 2,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  insightIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  askContainer: {
    marginBottom: 20,
  },
  questionInput: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  askButtonDisabled: {
    backgroundColor: '#555',
  },
  askButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerCard: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  answerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b8a',
  },
  answerText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 24,
  },
  suggestedQuestions: {
    marginTop: 10,
  },
  suggestedTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  suggestedQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestedQuestionText: {
    flex: 1,
    fontSize: 14,
    color: '#aaa',
  },
  premiumGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  premiumIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  premiumDesc: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Chat styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  coachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  coachStatus: {
    fontSize: 12,
    color: '#2ed573',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 16,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff6b8a',
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a4e',
    borderBottomLeftRadius: 4,
  },
  bubbleAvatar: {
    fontSize: 20,
  },
  chatText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  userText: {
    color: '#fff',
  },
  coachText: {
    color: '#eee',
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickQuestion: {
    backgroundColor: '#3a3a5e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickQuestionText: {
    color: '#fff',
    fontSize: 13,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#2a2a4e',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff6b8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#555',
  },
  // Chat wrapper styles for fixed input
  chatWrapper: {
    flex: 1,
  },
  chatScrollView: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  chatInputWrapper: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  // Mission Card Styles
  missionCard: {
    backgroundColor: 'linear-gradient(135deg, #ff6b8a 0%, #ff8e53 100%)',
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ff6b8a',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  missionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyEasy: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
  },
  difficultyMedium: {
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
  },
  difficultyHard: {
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
  },
  difficultyText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pointsBadge: {
    backgroundColor: 'rgba(243, 156, 18, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: 'bold',
  },
  missionDescription: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
    marginBottom: 16,
  },
  missionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b8a',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  missionButtonCompleted: {
    backgroundColor: '#2ed573',
  },
  missionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Date Night Styles
  dateNightScroll: {
    paddingRight: 20,
  },
  dateNightCard: {
    width: 160,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  dateNightIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dateNightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  dateNightDesc: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 12,
    lineHeight: 16,
  },
  dateNightMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  dateNightTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  dateNightTagText: {
    fontSize: 10,
    color: '#888',
  },
  // Badges Styles
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: (width - 52) / 2,
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  badgeLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: '#888',
  },
  badgeDesc: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeProgress: {
    width: '100%',
    alignItems: 'center',
  },
  badgeProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: '#ff6b8a',
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 10,
    color: '#666',
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
