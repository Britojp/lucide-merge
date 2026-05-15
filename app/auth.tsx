import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { X } from "lucide-react-native";
import { AppIcon } from "@/components/ui/AppIcon";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Request timed out. Check your connection and try again.",
            ),
          ),
        ms,
      ),
    ),
  ]);
}

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const { theme } = useSettings();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
  };

  async function handleEmailAuth() {
    clearMessages();
    if (!email.trim() || !password) {
      setError("Fill in email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email: email.trim(), password }),
        );
        if (error) throw error;
        router.dismiss();
      } else {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({ email: email.trim(), password }),
        );
        if (error) throw error;
        if (data.session) {
          router.dismiss();
        } else {
          const { data: signInData, error: signInError } = await withTimeout(
            supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            }),
          );
          if (!signInError && signInData.session) {
            router.dismiss();
          } else {
            const code = (signInError as { code?: string } | null)?.code;
            const msg =
              code === "email_not_confirmed" ||
              signInError?.message?.toLowerCase().includes("not confirmed")
                ? "In the Supabase dashboard: Authentication → Providers → Email, turn off «Confirm email» to allow sign-in right after sign-up."
                : signInError?.message ??
                  "Could not sign in after creating the account.";
            setError(msg);
            Alert.alert("Error", msg);
          }
        }
      }
    } catch (e: any) {
      console.error("[auth] caught error:", e);
      const msg: string =
        e?.message ||
        e?.error_description ||
        (typeof e === "string" ? e : "") ||
        "Connection failed. Check your internet and try again.";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    clearMessages();
    setLoading(true);
    try {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: "lucidemerge" });
      const { data, error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo, skipBrowserRedirect: true },
        }),
      );
      if (error || !data.url) throw error ?? new Error("No URL");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type === "success" && result.url) {
        const hash = new URL(result.url).hash.replace("#", "");
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token") ?? "";
        if (access_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          router.dismiss();
        }
      }
    } catch (e: any) {
      const msg = e?.message ?? "Google sign-in failed.";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    clearMessages();
    setLoading(true);
    try {
      const rawNonce = Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken!,
        nonce: rawNonce,
      });
      if (error) throw error;
      router.dismiss();
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        const msg = e?.message ?? "Apple sign-in failed.";
        setError(msg);
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.bg }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Close */}
          <Pressable style={styles.closeBtn} onPress={() => router.dismiss()}>
            <AppIcon icon={X} size={22} color={theme.ink2} />
          </Pressable>

          {/* Title */}
          <Text style={styles.title}>
            Lucid <Text style={styles.titleItalic}>Merge</Text>
          </Text>
          <Text style={styles.sub}>Save your progress across devices.</Text>

          {/* Mode tabs */}
          <View style={[styles.tabs, { borderColor: theme.line }]}>
            {(["signin", "signup"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                style={[
                  styles.tab,
                  mode === m && { backgroundColor: theme.ink },
                ]}
                onPress={() => {
                  setMode(m);
                  clearMessages();
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: mode === m ? theme.bg : theme.ink2 },
                  ]}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Email / password */}
          <View style={styles.fields}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.line,
                  color: theme.ink,
                  backgroundColor: theme.bg2,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={theme.ink3}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.line,
                  color: theme.ink,
                  backgroundColor: theme.bg2,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={theme.ink3}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.ink }]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: theme.bg }]}>
                {mode === "signin" ? "Sign in" : "Create account"}
              </Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.line }]}
            />
            <Text style={[styles.dividerText, { color: theme.ink3 }]}>or</Text>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.line }]}
            />
          </View>

          {/* Social */}
          <Pressable
            style={[
              styles.socialBtn,
              { borderColor: theme.line, backgroundColor: theme.bg2 },
            ]}
            onPress={handleGoogle}
          >
            <Ionicons name="logo-google" size={18} color={theme.ink} />
            <Text style={[styles.socialBtnText, { color: theme.ink }]}>
              Continue with Google
            </Text>
          </Pressable>

          {Platform.OS === "ios" && (
            <Pressable
              style={[
                styles.socialBtn,
                { borderColor: theme.line, backgroundColor: theme.ink },
              ]}
              onPress={handleApple}
            >
              <Ionicons name="logo-apple" size={18} color={theme.bg} />
              <Text style={[styles.socialBtnText, { color: theme.bg }]}>
                Sign in with Apple
              </Text>
            </Pressable>
          )}

          <Text style={[styles.hint, { color: theme.ink3 }]}>
            Your score and settings sync automatically when signed in.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 20 },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: -0.6,
    color: "#3C3830",
    marginBottom: 4,
  },
  titleItalic: { fontStyle: "italic" },
  sub: { fontSize: 14, color: "#7A7469", marginBottom: 28, fontWeight: "400" },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 11 },
  tabText: { fontSize: 13, fontWeight: "500" },
  fields: { gap: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "400",
  },
  error: { color: "#C0392B", fontSize: 13, marginTop: 6, marginBottom: 2 },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  socialBtnText: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 12, textAlign: "center", marginTop: 12, lineHeight: 18 },
});
