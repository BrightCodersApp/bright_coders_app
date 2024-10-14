

import React, { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  ActivityIndicator
} from "react-native";
import firebase from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithRedirect,signInWithEmailAndPassword, getRedirectResult, signInWithCredential  } from 'firebase/auth';
import { supabase } from "../lib/supabase"; // استيراد عميل Supabase
import { useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// تهيئة Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA1KPmv2JDofMwXhO0YM2jlOgNUNitISqY",
  authDomain: "pright-coder.firebaseapp.com",
  projectId: "pright-coder",
  storageBucket: "pright-coder.appspot.com",
  messagingSenderId: "922642052240",
  appId: "1:922642052240:web:7518442e0dae0cc1399415",
  measurementId: "G-9JC923JTB2"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth();  // هنا يتم تهيئة auth


type AuthScreenRouteProp = RouteProp<{ Auth: { role: string } }, 'Auth'>;

export default function Auth({ navigation }: { navigation: NavigationProp<any> }) {
  const route = useRoute<AuthScreenRouteProp>();
  const { role } = route.params || {};

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // التسجيل بالبريد الإلكتروني وكلمة المرور باستخدام Firebase
  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // ربط المستخدم بقاعدة بيانات Supabase
      await saveUserInSupabase(user);
      Alert.alert("Success", "Account created!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred during sign up");
    }
    setLoading(false);
  }

  // تسجيل الدخول بالبريد الإلكتروني وكلمة المرور باستخدام Firebase
  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // تحقق من دور المستخدم من قاعدة بيانات Supabase
      await navigateBasedOnRole(user);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  }

  GoogleSignin.configure({
    webClientId: '922642052240-obesle6ea1126d88nlqugq3vqd1a054s.apps.googleusercontent.com',
  });
  
// Google Sign-In flow
const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn(); // Destructure idToken properly

    // Create Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential); // Correct usage of signInWithCredential

    const user = userCredential.user;
    console.log('User signed in with Google:', user);

    await saveUserInSupabase(user); // Save the user to Supabase after signing in with Google
    navigateBasedOnRole(user); // Navigate based on role
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};


// تسجيل الدخول باستخدام Facebook
const signInWithFacebook = async () => {
  const provider = new FacebookAuthProvider();
  try {
    // بدء عملية إعادة التوجيه
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    Alert.alert("Error", error.message);
  }
};



 // بعد التسجيل، ربط المستخدم بقاعدة بيانات Supabase
async function saveUserInSupabase(user: any) { // إزالة firebase.User
  try {
    const { error } = await supabase
      .from('profiles')
      .insert([{ id: user.uid, email: user.email}]); // تخصيص الدور حسب الحاجة

    if (error) throw error;
  } catch (error: any) {
    console.error('Error saving user in Supabase:', error.message);
  }
}

// توجيهه بناءً على دور المستخدم في Supabase
async function navigateBasedOnRole(user: any) { // إزالة firebase.User
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.uid)
      .single();

    if (profileError || !profileData) {
      Alert.alert("Failed to retrieve user role");
      return;
    }

    switch (profileData.role) {
      case 'Student':
        navigation.navigate('StudentHome');
        break;
      case 'Teacher':
        navigation.navigate('TeacherDashboard');
        break;
      case 'Parent':
        navigation.navigate('ParentHome');
        break;
      default:
        Alert.alert("Unknown user role");
    }
  } catch (error: any) {
    console.error("Error navigating based on role:", error.message);
  }
}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require("../assets/background.png")}
        style={styles.background}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.header}>SIGN IN</Text>
            <Text style={styles.subHeader}>Sign in to access your personalized learning Bright Coding</Text>

            {role && <Text style={styles.roleText}>Role: {role}</Text>}

            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Image source={require("../assets/google-logo.png")} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor="#ccc"
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#ccc"
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.forgotPassword}>Forgot Password?</Text>

                <Pressable style={styles.signInButton} onPress={() => signInWithEmail()} disabled={loading}>
                  <Text style={styles.buttonText}>Login</Text>
                </Pressable>

                <Text style={styles.orText}>Or Sign In with</Text>

                <Pressable style={[styles.socialButton, styles.googleButton]} onPress={signInWithGoogle}>
                  <Image source={require("../assets/google-logo.png")} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Sign In With Google</Text>
                </Pressable>

                <Pressable style={[styles.socialButton, styles.facebookButton]} onPress={signInWithFacebook}>
                  <Image source={require("../assets/facebook.png")} style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>Sign In With Facebook</Text>
                </Pressable>

                <Text style={styles.signUpText}>
                  Don’t have an account?{" "}
                  <Text style={styles.signUpLink} onPress={() => navigation.navigate("SignUp", { role })}>
                    Sign Up
                  </Text>
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1
  },
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 50
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 14,
    textAlign: "center",
    color: "#ccc",
    marginBottom: 20,
  },
  roleText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    height: 50,
    flex: 1,
    color: "#000",
  },
  forgotPassword: {
    textAlign: "right",
    color: "#ccc",
    marginBottom: 20,
    width: "100%",
  },
  signInButton: {
    backgroundColor: "#6a1b9a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 20,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  orText: {
    textAlign: "center",
    color: "#ccc",
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 15,
    width: "100%",
  },
  facebookButton: {
    backgroundColor: "#3b5998",
  },
  googleButton: {
    backgroundColor: "#db4437",
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signUpText: {
    textAlign: "center",
    color: "#fff",
    marginTop: 20,
  },
  signUpLink: {
    fontWeight: "bold",
    color: "#ff4081",
  },
});


