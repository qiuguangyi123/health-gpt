import { zodResolver } from "@hookform/resolvers/zod"
import { router } from "expo-router"
import React, { useState } from "react"
import type { SubmitHandler } from "react-hook-form"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { Alert, StyleSheet, View } from "react-native"
import {
  ActivityIndicator,
  Button,
  Card,
  HelperText,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import { z } from "zod"

import { useAuth } from "@/contexts/AuthContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const theme = useTheme()
  const { login } = useAuth()

  const schema = z.object({
    password: z.string().min(6, "密码至少 6 位"),
    email: z.any(),
  })

  type FormValues = z.infer<typeof schema>

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    card: {
      borderRadius: 15,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    title: {
      textAlign: "center",
      marginBottom: 20,
      color: "#2c3e50",
    },
    input: {
      marginBottom: 15,
    },
    loginButton: {
      marginTop: 10,
      borderRadius: 8,
    },
    clearButton: {
      marginTop: 10,
      borderRadius: 8,
    },
    buttonContent: {
      paddingVertical: 8,
    },
    modalContent: {
      backgroundColor: "white",
      padding: 30,
      margin: 20,
      borderRadius: 12,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 15,
      color: "#666",
      textAlign: "center",
    },
  })

  const onSubmit: SubmitHandler<FormValues> = async ({ email, password }) => {
    setIsLoading(true)
    try {
      const result = await login(email, password)
      if (result.success) {
        router.replace("/(tabs)")
      } else {
        Alert.alert("登录失败", result.error || "请检查邮箱和密码")
      }
    } catch (error) {
      Alert.alert("错误", "登录过程中发生错误")
    } finally {
      setIsLoading(false)
    }
  }

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear()
      Alert.alert("成功", "已清除所有存储数据")
    } catch (error) {
      Alert.alert("错误", "清除存储失败")
    }
  }

  return (
    <FormProvider {...methods}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              欢迎登录
            </Text>

            <Controller
              name="email"
              control={methods.control}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error },
              }) => (
                <>
                  <TextInput
                    label="邮箱"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="email" />}
                    style={styles.input}
                    mode="outlined"
                    error={!!error}
                    disabled={isLoading}
                  />
                  <HelperText type="error" visible={!!error}>
                    {error?.message}
                  </HelperText>
                </>
              )}
            />

            <Controller
              name="password"
              control={methods.control}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error },
              }) => (
                <>
                  <TextInput
                    label="密码"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    left={<TextInput.Icon icon="lock" />}
                    style={styles.input}
                    mode="outlined"
                    error={!!error}
                    disabled={isLoading}
                  />
                  <HelperText type="error" visible={!!error}>
                    {error?.message}
                  </HelperText>
                </>
              )}
            />

            <Button
              mode="contained"
              onPress={methods.handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>

            <Button
              mode="contained"
              onPress={clearStorage}
              style={styles.clearButton}
              contentStyle={styles.buttonContent}
              buttonColor="#FF9500"
            >
              清除存储数据
            </Button>
          </Card.Content>
        </Card>

        <Portal>
          <Modal
            visible={isLoading}
            dismissable={false}
            contentContainerStyle={styles.modalContent}
          >
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge" style={styles.loadingText}>
              正在登录...
            </Text>
          </Modal>
        </Portal>
      </View>
    </FormProvider>
  )
}
