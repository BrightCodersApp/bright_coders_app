

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'; // Correct imports
import { supabase } from '../lib/supabase';
import { AuthStackParamList } from '../lib/routeType';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;
type SignUpScreenRouteProp = RouteProp<AuthStackParamList, 'SignUp'>;

interface SignUpProps {
  navigation: SignUpScreenNavigationProp;
  route: SignUpScreenRouteProp;
}


// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyA1KPmv2JDofMwXhO0YM2jlOgNUNitISqY',
  authDomain: 'pright-coder.firebaseapp.com',
  projectId: 'pright-coder',
  storageBucket: 'pright-coder.appspot.com',
  messagingSenderId: '922642052240',
  appId: '1:922642052240:web:7518442e0dae0cc1399415',
  measurementId: 'G-9JC923JTB2',
};

const app = initializeApp(firebaseConfig);
const authInstance  = getAuth(); // Initialize Firebase Auth

export default function SignUp({ navigation, route }: SignUpProps) {
  const role = route?.params?.role;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!role) {
    Alert.alert('Error', 'Role is not defined');
    return null;
  }


  // Sign-up with email and password using Firebase Auth
  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill all the fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(authInstance , email, password);
      const user = userCredential.user;

      if (user) {
        await saveUserInSupabase(user);
        navigationBasedOnRole(user);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  GoogleSignin.configure({
    webClientId: '922642052240-obesle6ea1126d88nlqugq3vqd1a054s.apps.googleusercontent.com',
  });

  // Save user data to Supabase
  async function saveUserInSupabase(user: any) {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: user.uid, full_name: fullName, email: user.email, role }]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving user in Supabase:', error.message);
    }
  }

  // Navigate based on the user's role
  const navigationBasedOnRole = (user: any) => {
    if (role === 'Teacher') {
      navigation.navigate('TeacherDetails', { userId: user.uid });
    } else if (role === 'Student') {
      navigation.navigate('AgeSelection');
    } else if (role === 'Parent') {
      navigation.navigate('DetailsParent');
    }
  };

  // Google Sign-In flow
  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(authInstance , googleCredential);
      const user = userCredential.user;

      await saveUserInSupabase(user);
      navigationBasedOnRole(user);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error.message);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ImageBackground source={require('../assets/background.png')} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>SIGN UP</Text>
            <Text style={styles.subtitle}>Create Your Account To Embark On Your Educational Adventure</Text>

            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              leftIcon={{ type: 'font-awesome', name: 'user', color: '#fff' }}
              inputStyle={{ color: '#fff' }}
              placeholderTextColor="#888"
              containerStyle={styles.inputContainer}
              autoCapitalize="none"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="youremail@gmail.com"
              leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#fff' }}
              inputStyle={{ color: '#fff' }}
              placeholderTextColor="#888"
              containerStyle={styles.inputContainer}
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              leftIcon={{ type: 'font-awesome', name: 'lock', color: '#fff' }}
              rightIcon={
                <Icon
                  type="font-awesome"
                  name={passwordVisible ? 'eye-slash' : 'eye'}
                  color="#fff"
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
              inputStyle={{ color: '#fff' }}
              placeholderTextColor="#888"
              containerStyle={styles.inputContainer}
              autoCapitalize="none"
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              secureTextEntry={!confirmPasswordVisible}
              leftIcon={{ type: 'font-awesome', name: 'lock', color: '#fff' }}
              rightIcon={
                <Icon
                  type="font-awesome"
                  name={confirmPasswordVisible ? 'eye-slash' : 'eye'}
                  color="#fff"
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                />
              }
              inputStyle={{ color: '#fff' }}
              placeholderTextColor="#888"
              containerStyle={styles.inputContainer}
              autoCapitalize="none"
            />

            <Button
              title="Sign Up"
              onPress={handleSignUp}
              buttonStyle={styles.signUpButton}
              titleStyle={styles.signUpButtonText}
              disabled={loading}
            />

            <Text style={styles.orText}>Or Sign Up with</Text>

            <Button
              title="Sign Up With Google"
              onPress={() => {
                signInWithGoogle();
              }}
              buttonStyle={styles.googleButton}
              titleStyle={styles.socialButtonText}
              icon={{ name: 'google', type: 'font-awesome', color: '#fff', size: 20 }}
              iconContainerStyle={{ marginRight: 10 }}
            />

            <Text style={styles.signInText}>
              Already have an Account?{' '}
              <Text style={styles.signInLink} onPress={() => navigation.navigate('Auth', { role })}>
                Sign In here
              </Text>
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    marginTop: 30,
  },
  title: {
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 10,
  },
  signUpButton: {
    backgroundColor: '#B34AF3',
    paddingVertical: 10,
    borderRadius: 10,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  signInLink: {
    color: '#B34AF3',
    fontWeight: 'bold',
  },
});


