import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
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
  Button,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  duration?: number // 语音时长（秒）
  timestamp: Date
  isVoice?: boolean
  isThinking?: boolean // 是否正在思考中
  cardType?: "prescription" | "appointment" | "normal" // 卡片类型
  cardData?: PrescriptionCard | AppointmentCard // 卡片数据
}

interface PrescriptionCard {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  deepLink?: string // 第三方app的deep link
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
      content: "你好！我是豆包，有什么可以帮你的吗？你可以使用语音或文字与我交流，我还可以为您开具电子处方。",
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
      toValue: 1.2,
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
              medicationName: "阿莫西林胶囊",
              dosage: "每次2粒，每粒0.25g",
              frequency: "每日3次",
              duration: "7天",
              deepLink: "meditationapp://prescription/12345", // 示例deep link
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

  // 处方卡片组件
  const renderPrescriptionCard = (cardData: PrescriptionCard) => {
    const handlePress = () => {
      if (cardData.deepLink) {
        Linking.openURL(cardData.deepLink).catch(err =>
          console.error("无法打开链接:", err)
        )
      }
    }

    return (
      <Pressable onPress={handlePress}>
        <Surface
          style={[
            styles.prescriptionCard,
            { backgroundColor: theme.colors.surface },
          ]}
          elevation={2}
        >
          <View style={styles.cardHeader}>
            <IconButton
              icon="pill"
              size={20}
              iconColor={theme.colors.primary}
              style={styles.cardIcon}
            />
            <Text
              variant="titleMedium"
              style={[
                styles.cardTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              电子处方
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
                药品名称：
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.cardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {cardData.medicationName}
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
                用量：
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.cardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {cardData.dosage}
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
                频次：
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.cardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {cardData.frequency}
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
                疗程：
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.cardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {cardData.duration}
              </Text>
            </View>
          </View>
          {cardData.deepLink && (
            <View style={styles.cardFooter}>
              <IconButton
                icon="open-in-new"
                size={16}
                iconColor={theme.colors.primary}
              />
              <Text
                variant="bodySmall"
                style={[
                  styles.cardLink,
                  { color: theme.colors.primary },
                ]}
              >
                在第三方应用中打开
              </Text>
            </View>
          )}
        </Surface>
      </Pressable>
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
          {item.isVoice && (
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
          )}

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
                  {renderPrescriptionCard(item.cardData as PrescriptionCard)}
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
      <Image
        source={require(`@/assets/images/${true ? "icon" : "logo"}.png`)}
        style={{ width: undefined, height: undefined, flex: 1 }}
      />
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
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
        elevation={1}
      >
        <View style={styles.inputContainer}>
          {/* 切换模式图标 */}
          <IconButton
            icon={inputMode === "voice" ? "microphone" : "keyboard"}
            iconColor={theme.colors.primary}
            size={24}
            onPress={() => {
              setInputMode(inputMode === "voice" ? "text" : "voice")
              if (inputMode === "voice" && isRecording) {
                setIsRecording(false)
              }
            }}
            style={styles.modeToggleIcon}
          />

          {/* 输入框/按钮 */}
          {inputMode === "voice" ? (
            <Pressable
              style={styles.voiceButtonWrapper}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isTranscribing}
            >
              <Animated.View
                style={[
                  {
                    transform: [{ scale: pressAnimation }],
                    flex: 1,
                  },
                ]}
              >
                <Button
                  mode="outlined"
                  icon={
                    isTranscribing
                      ? undefined
                      : isRecording
                      ? "stop-circle"
                      : "microphone"
                  }
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
                  labelStyle={[
                    styles.voiceButtonLabel,
                    {
                      color: isRecording
                        ? theme.colors.error
                        : theme.colors.primary,
                    },
                  ]}
                  contentStyle={styles.voiceButtonContent}
                >
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
                  ) : isRecording ? (
                    "正在录音"
                  ) : (
                    "长按输入语音"
                  )}
                </Button>
              </Animated.View>
            </Pressable>
          ) : (
            <TextInput
              mode="outlined"
              placeholder="输入消息..."
              value={textInput}
              onChangeText={setTextInput}
              style={styles.textInput}
              multiline
              maxLength={500}
              right={
                <TextInput.Icon
                  icon="send"
                  onPress={handleSendText}
                  disabled={!textInput.trim()}
                />
              }
              onSubmitEditing={handleSendText}
            />
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
    padding: 12,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    marginHorizontal: 6,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 0,
  },
  messageText: {
    lineHeight: 20,
  },
  voiceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  voiceIcon: {
    margin: 0,
    marginRight: 4,
  },
  voiceDuration: {
    fontSize: 11,
  },
  messageTime: {
    marginTop: 6,
    fontSize: 10,
    opacity: 0.6,
  },
  bottomContainer: {
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modeToggleIcon: {
    margin: 0,
  },
  voiceButtonWrapper: {
    flex: 1,
  },
  voiceButton: {
    flex: 1,
    borderRadius: 8,
  },
  voiceButtonContent: {
    paddingVertical: 8,
  },
  voiceButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  voiceButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceButtonText: {
    fontSize: 15,
  },
  recordingInfo: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  recordingText: {
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 16,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 2,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.25,
    minHeight: 4,
  },
  textInput: {
    backgroundColor: "transparent",
    flex: 1,
  },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  thinkingWrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  thinkingText: {
    marginTop: 8,
    fontSize: 12,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  prescriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIcon: {
    margin: 0,
    marginRight: 8,
  },
  cardTitle: {
    fontWeight: "600",
  },
  cardContent: {
    gap: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLabel: {
    width: 80,
    fontSize: 12,
  },
  cardValue: {
    flex: 1,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  cardLink: {
    fontWeight: "500",
  },
})
