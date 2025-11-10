import { font } from "@/utils/scale"
import * as Haptics from "expo-haptics"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native"
import {
  ActivityIndicator,
  Avatar,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { moderateScale, scale, verticalScale } from "react-native-size-matters"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  duration?: number // 语音时长（秒）
  timestamp: Date
  isVoice?: boolean
  isThinking?: boolean // 是否正在思考中
  cardType?: "prescription" | "appointment" | "normal" // 卡片类型
  cardData?: PrescriptionData | AppointmentCard // 卡片数据
}

interface Medication {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  deepLink?: string // 第三方app的deep link
}

interface PrescriptionData {
  medications: Medication[] // 支持多个药物
}

interface AppointmentCard {
  title: string
  date: string
  location: string
  deepLink?: string
}

// 模拟语音波形数据
const generateWaveformData = (count: number = 30): number[] => {
  return Array.from({ length: count }, () => Math.random() * 0.8 + 0.2)
}

type InputMode = "voice" | "text"

export default function HomeScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [inputMode, setInputMode] = useState<InputMode>("voice")
  const [textInput, setTextInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "你好！我是豆包，有什么可以帮你的吗？你可以使用语音或文字与我交流，我还可以为您开具电子处方。",
      timestamp: new Date(),
    },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveformTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const flatListRef = useRef<FlatList>(null)
  const pressAnimation = useRef(new Animated.Value(1)).current

  // 生成波形动画
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setWaveformData(generateWaveformData())
      }, 100)
      waveformTimer.current = interval
      return () => {
        if (waveformTimer.current) {
          clearInterval(waveformTimer.current)
        }
      }
    } else {
      setWaveformData([])
    }
  }, [isRecording])

  // 录制时长计时器
  useEffect(() => {
    if (isRecording) {
      durationTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1)
      }, 100)
    } else {
      if (durationTimer.current) {
        clearInterval(durationTimer.current)
        durationTimer.current = null
      }
    }
    return () => {
      if (durationTimer.current) {
        clearInterval(durationTimer.current)
      }
    }
  }, [isRecording])

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsRecording(true)
    setRecordingDuration(0)
    Animated.spring(pressAnimation, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = async () => {
    Animated.spring(pressAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start()

    if (recordingDuration < 0.5) {
      // 录制时间太短，取消
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setIsRecording(false)
      setRecordingDuration(0)
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsRecording(false)
    setIsTranscribing(true)

    // 模拟语音转录
    setTimeout(() => {
      const transcript = `这是一条语音消息（${recordingDuration.toFixed(1)}秒）`
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: transcript,
        duration: recordingDuration,
        timestamp: new Date(),
        isVoice: true,
      }

      setMessages(prev => [...prev, newMessage])
      setIsTranscribing(false)
      setRecordingDuration(0)
      sendMessage(newMessage)
    }, 1500)
  }

  const handleSendText = () => {
    if (!textInput.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: textInput.trim(),
      timestamp: new Date(),
      isVoice: false,
    }

    setMessages(prev => [...prev, newMessage])
    setTextInput("")
    sendMessage(newMessage)
  }

  const sendMessage = (userMessage: Message) => {
    // 乐观更新：立即显示思考中的消息
    const thinkingMessageId = `thinking-${Date.now()}`
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isThinking: true,
    }
    setMessages(prev => [...prev, thinkingMessage])

    // 模拟AI回复，检测是否需要返回处方卡片
    const shouldShowPrescription =
      userMessage.content.includes("处方") ||
      userMessage.content.includes("开药") ||
      userMessage.content.includes("药品")

    setTimeout(() => {
      // 移除思考消息，添加实际回复
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingMessageId)

        if (shouldShowPrescription) {
          // 返回处方卡片消息
          const prescriptionMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: "根据您的症状，我为您开具了以下处方，请查收：",
            timestamp: new Date(),
            cardType: "prescription",
            cardData: {
              medications: [
                {
                  medicationName: "阿莫西林胶囊",
                  dosage: "每次2粒，每粒0.25g",
                  frequency: "每日3次",
                  duration: "7天",
                  deepLink: "rxapp://prescription/amoxicillin/12345",
                },
                {
                  medicationName: "布洛芬缓释胶囊",
                  dosage: "每次1粒，每粒0.3g",
                  frequency: "每日2次",
                  duration: "5天",
                  deepLink: "rxapp://prescription/ibuprofen/12346",
                },
                {
                  medicationName: "维生素C片",
                  dosage: "每次2片，每片100mg",
                  frequency: "每日1次",
                  duration: "14天",
                  deepLink: "rxapp://prescription/vitaminc/12347",
                },
              ],
            },
          }
          return [...filtered, prescriptionMessage]
        } else {
          // 普通回复
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: userMessage.isVoice
              ? "好的，我收到了你的语音消息。有什么可以帮助您的吗？"
              : "我理解你的意思了，让我来帮助你。如果您需要开具处方，请告诉我您的症状。",
            timestamp: new Date(),
          }
          return [...filtered, aiMessage]
        }
      })
    }, 2000) // 增加延迟以更好地展示思考动画
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatMessageTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 思考中动画组件
  const ThinkingDots = () => {
    const dot1Anim = useRef(new Animated.Value(0)).current
    const dot2Anim = useRef(new Animated.Value(0)).current
    const dot3Anim = useRef(new Animated.Value(0)).current

    useEffect(() => {
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        )
      }

      const anim1 = createAnimation(dot1Anim, 0)
      const anim2 = createAnimation(dot2Anim, 150)
      const anim3 = createAnimation(dot3Anim, 300)

      anim1.start()
      anim2.start()
      anim3.start()

      return () => {
        anim1.stop()
        anim2.stop()
        anim3.stop()
      }
    }, [])

    const dotStyle = (animValue: Animated.Value) => ({
      opacity: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
      }),
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -4],
          }),
        },
      ],
    })

    return (
      <View style={styles.thinkingContainer}>
        <Animated.View
          style={[
            styles.thinkingDot,
            { backgroundColor: theme.colors.primary },
            dotStyle(dot1Anim),
          ]}
        />
        <Animated.View
          style={[
            styles.thinkingDot,
            { backgroundColor: theme.colors.primary },
            dotStyle(dot2Anim),
          ]}
        />
        <Animated.View
          style={[
            styles.thinkingDot,
            { backgroundColor: theme.colors.primary },
            dotStyle(dot3Anim),
          ]}
        />
      </View>
    )
  }

  // 处方卡片组件 - 支持多个药物
  const renderPrescriptionCard = (cardData: PrescriptionData) => {
    const handleMedicationPress = (deepLink?: string) => {
      if (deepLink) {
        Linking.openURL(deepLink).catch(err =>
          console.error("无法打开链接:", err)
        )
      }
    }

    return (
      <View>
        {/* 处方标题 */}
        <View style={styles.prescriptionHeader}>
          <IconButton
            icon="pill"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.cardIcon}
          />
          <Text
            variant="titleMedium"
            style={[
              styles.prescriptionTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            电子处方
          </Text>
        </View>

        {/* 药物列表 */}
        {cardData.medications.map((medication, index) => (
          <Pressable
            key={index}
            onPress={() => handleMedicationPress(medication.deepLink)}
          >
            <Surface
              style={[
                styles.medicationCard,
                { backgroundColor: theme.colors.surface },
                index < cardData.medications.length - 1 && {
                  marginBottom: verticalScale(8),
                },
              ]}
              elevation={2}
            >
              <View style={styles.medicationHeader}>
                <View style={styles.medicationNumberBadge}>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.medicationNumber,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.medicationName,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {medication.medicationName}
                </Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.cardLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    用量:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.cardValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {medication.dosage}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.cardLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    频次:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.cardValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {medication.frequency}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.cardLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    疗程:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.cardValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {medication.duration}
                  </Text>
                </View>
              </View>

              {medication.deepLink && (
                <View style={styles.cardFooter}>
                  <IconButton
                    icon="open-in-new"
                    size={16}
                    iconColor={theme.colors.primary}
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.cardLink, { color: theme.colors.primary }]}
                  >
                    在第三方应用中打开
                  </Text>
                </View>
              )}
            </Surface>
          </Pressable>
        ))}
      </View>
    )
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.type === "user"

    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <Avatar.Icon
            size={28}
            icon="robot"
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? {
                  backgroundColor: theme.colors.primary,
                  borderBottomRightRadius: 4,
                }
              : {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderBottomLeftRadius: 4,
                },
            { maxWidth: Dimensions.get("window").width * 0.72 },
          ]}
        >
          {/* {item.isVoice && (
            <View style={styles.voiceIndicator}>
              <IconButton
                icon="waveform"
                iconColor={isUser ? "#fff" : theme.colors.primary}
                size={18}
                style={styles.voiceIcon}
              />
              {item.duration && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.voiceDuration,
                    {
                      color: isUser ? "#fff" : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {formatTime(item.duration)}
                </Text>
              )}
            </View>
          )} */}

          {/* 思考中状态 */}
          {item.isThinking ? (
            <View style={styles.thinkingWrapper}>
              <ThinkingDots />
              <Text
                variant="bodySmall"
                style={[
                  styles.thinkingText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                正在思考中...
              </Text>
            </View>
          ) : (
            <>
              {/* 处方卡片 */}
              {item.cardType === "prescription" && item.cardData && (
                <View style={styles.cardWrapper}>
                  {renderPrescriptionCard(item.cardData as PrescriptionData)}
                </View>
              )}

              {/* 普通文本消息 */}
              <Text
                variant="bodyMedium"
                style={[
                  styles.messageText,
                  {
                    color: isUser ? "#fff" : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {item.content}
              </Text>
            </>
          )}

          <Text
            variant="bodySmall"
            style={[
              styles.messageTime,
              {
                color: isUser
                  ? "rgba(255,255,255,0.6)"
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>

        {isUser && (
          <Avatar.Icon
            size={28}
            icon="account"
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          />
        )}
      </View>
    )
  }

  const renderWaveform = () => {
    if (!isRecording || waveformData.length === 0) return null

    return (
      <View style={styles.waveformContainer}>
        {waveformData.map((height, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 40,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        ))}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.keyboardView,
        { backgroundColor: theme.colors.background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }}
        ListFooterComponent={null}
      />

      {/* 录制时的波形和时长显示 */}
      {isRecording && inputMode === "voice" && (
        <View style={styles.recordingInfo}>
          <Text
            variant="bodyMedium"
            style={[styles.recordingText, { color: theme.colors.error }]}
          >
            {formatTime(recordingDuration)}
          </Text>
          {renderWaveform()}
        </View>
      )}

      {/* 底部操作区 */}
      <Surface
        style={[
          styles.bottomContainer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            // paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
        elevation={1}
      >
        <View style={styles.inputContainer}>
          {/* 切换模式图标 - 录音时占位但不可见 */}
          {/* <View style={styles.modeToggleIconContainer}> */}
          {!isRecording && !isTranscribing && (
            <IconButton
              icon={inputMode === "voice" ? "microphone" : "keyboard"}
              iconColor={theme.colors.primary}
              size={moderateScale(24)}
              onPress={() => {
                setInputMode(inputMode === "voice" ? "text" : "voice")
                if (inputMode === "voice" && isRecording) {
                  setIsRecording(false)
                }
              }}
              style={styles.modeToggleIcon}
            />
          )}
          {/* </View> */}

          {/* 输入框/按钮 */}
          {inputMode === "voice" ? (
            <Animated.View
              style={[
                styles.voiceButtonWrapper,
                {
                  transform: [{ scale: pressAnimation }],
                },
              ]}
            >
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isTranscribing}
                style={[
                  styles.voiceButton,
                  {
                    backgroundColor: isRecording
                      ? theme.colors.errorContainer
                      : theme.colors.surface,
                    borderColor: isRecording
                      ? theme.colors.error
                      : theme.colors.outline,
                  },
                ]}
              >
                <View style={styles.voiceButtonContent}>
                  {isTranscribing ? (
                    <View style={styles.voiceButtonInner}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.voiceButtonText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        转写中...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.voiceButtonLabel,
                        {
                          color: isRecording
                            ? theme.colors.error
                            : theme.colors.primary,
                        },
                      ]}
                    >
                      {isRecording ? "正在录音" : "长按输入语音"}
                    </Text>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.textInputWrapper} pointerEvents="box-none">
              <TextInput
                mode="outlined"
                placeholder="输入消息..."
                value={textInput}
                onChangeText={setTextInput}
                style={styles.textInput}
                multiline
                maxLength={500}
                contentStyle={styles.textInputContent}
                outlineStyle={styles.textInputOutline}
                onSubmitEditing={handleSendText}
                editable={true}
              />
              <IconButton
                icon="send"
                size={24}
                iconColor={
                  textInput.trim()
                    ? theme.colors.primary
                    : theme.colors.onSurfaceDisabled
                }
                onPress={handleSendText}
                disabled={!textInput.trim()}
                style={styles.sendIconButton}
              />
            </View>
          )}
        </View>
      </Surface>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: scale(12),
    paddingBottom: verticalScale(8),
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: verticalScale(12),
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    marginHorizontal: scale(6),
  },
  messageBubble: {
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    elevation: 0,
  },
  messageText: {
    lineHeight: verticalScale(20),
  },
  voiceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  voiceIcon: {
    margin: 0,
    marginRight: scale(4),
  },
  voiceDuration: {
    fontSize: font(11),
  },
  messageTime: {
    marginTop: verticalScale(6),
    fontSize: font(10),
    opacity: 0.6,
  },
  bottomContainer: {
    paddingTop: verticalScale(12),
    paddingHorizontal: scale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(4),
    minHeight: verticalScale(48),
  },
  modeToggleIconContainer: {
    width: scale(48),
    height: verticalScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  modeToggleIcon: {
    margin: 0,
    marginTop: verticalScale(4),
  },
  voiceButtonWrapper: {
    flex: 1,
    height: verticalScale(40),
  },
  voiceButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButtonContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonIcon: {
    margin: 0,
    marginRight: scale(-8),
  },
  voiceButtonLabel: {
    fontSize: font(14),
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  voiceButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  voiceButtonText: {
    fontSize: font(15),
  },
  recordingInfo: {
    alignItems: "center",
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: "transparent",
  },
  recordingText: {
    fontWeight: "600",
    marginBottom: verticalScale(8),
    fontSize: font(16),
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(40),
    gap: scale(2),
  },
  waveformBar: {
    width: scale(2.5),
    borderRadius: moderateScale(1.25),
    minHeight: verticalScale(4),
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(4),
  },
  textInput: {
    backgroundColor: "transparent",
    flex: 1,
    minHeight: verticalScale(40),
    maxHeight: verticalScale(120),
  },
  textInputContent: {
    paddingVertical: verticalScale(8),
    paddingRight: 0,
  },
  textInputOutline: {
    borderRadius: moderateScale(8),
  },
  sendIconButton: {
    margin: 0,
    marginTop: verticalScale(4),
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: verticalScale(8),
  },
  thinkingDot: {
    width: scale(8),
    height: verticalScale(8),
    borderRadius: moderateScale(4),
  },
  thinkingWrapper: {
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },
  thinkingText: {
    marginTop: verticalScale(8),
    fontSize: font(12),
  },
  cardWrapper: {
    marginBottom: verticalScale(8),
  },
  prescriptionCard: {
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginVertical: verticalScale(4),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  cardIcon: {
    margin: 0,
    marginRight: scale(8),
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: font(14),
  },
  cardContent: {
    gap: verticalScale(10),
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(4),
  },
  cardLabel: {
    fontSize: font(13),
    fontWeight: "500",
    minWidth: scale(30),
    marginRight: scale(8),
  },
  cardValue: {
    flex: 1,
    textAlign: "left",
    fontWeight: "500",
    fontSize: font(14),
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(12),
    paddingTop: verticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  cardLink: {
    fontWeight: "500",
  },
  // 处方标题样式
  prescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
    paddingLeft: scale(4),
  },
  prescriptionTitle: {
    fontWeight: "600",
    fontSize: font(16),
  },
  // 单个药物卡片样式
  medicationCard: {
    borderRadius: moderateScale(12),
    padding: scale(14),
  },
  medicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  medicationNumberBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "rgba(103, 80, 164, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(8),
  },
  medicationNumber: {
    fontWeight: "700",
    fontSize: font(12),
  },
  medicationName: {
    fontWeight: "600",
    fontSize: font(15),
    flex: 1,
  },
})
