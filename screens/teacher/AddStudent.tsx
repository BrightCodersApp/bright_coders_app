

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'; // استيراد Firebase Auth
import { supabase } from '../../lib/supabase'; 
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../lib/routeType';

type AddStudentScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AddStudent'>;

type Props = {
  navigation: AddStudentScreenNavigationProp;
  route: {
    params: {
      classId: string;
    };
  };
};

const AddStudent: React.FC<Props> = ({ navigation, route }) => {
  const { classId } = route.params;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // إضافة كلمة مرور للمستخدم
  const [loading, setLoading] = useState(false);

  const handleAddStudent = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      
      // إنشاء مستخدم جديد باستخدام Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      // إدخال بيانات الطالب في جدول "profiles" في Supabase
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.uid, // نستخدم uid الخاص بالمستخدم من Firebase
            full_name: fullName.trim(),
            email: email.trim(),
            role: 'Student',
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // الحصول على تاريخ التسجيل الحالي
      const enrollmentDate = new Date().toISOString();

      // ربط الطالب بالصف في جدول "class_students" في Supabase
      const { error: classError } = await supabase.from('class_students').insert([
        {
          class_id: classId,
          student_id: user.uid, // نستخدم uid الخاص بالمستخدم من Firebase
          enrollment_date: enrollmentDate,
        },
      ]);

      if (classError) {
        throw classError;
      }

      Alert.alert('Success', 'Student added successfully.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to add student:', error.message);
      Alert.alert('Error', `Failed to add student. Please try again. \n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Student</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter student's name"
        placeholderTextColor="#888"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter student's email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddStudent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Student</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8A2BE2',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddStudent;
