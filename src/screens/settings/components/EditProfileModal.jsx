import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';
import { ThemeContext } from '../../../context/ThemeContext';
import PremiumModal from '../../../components/PremiumModal';
import PremiumInput from '../../../components/PremiumInput';
import PremiumButton from '../../../components/PremiumButton';

const EditProfileModal = ({ visible, onClose, userInfo, onSave }) => {
    const { theme } = useContext(ThemeContext);
    const [name, setName] = useState(userInfo?.name || '');
    const [phone, setPhone] = useState(userInfo?.phone || '');
    const [email, setEmail] = useState(userInfo?.email || '');
    const [avatar, setAvatar] = useState(userInfo?.avatar || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ name, phone, email, avatar });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title="Profilni Tahrirlash"
            subtitle="Shaxsiy ma'lumotlaringizni o'zgartiring"
            headerGradient={['#667eea', '#764ba2']}
            footer={
                <PremiumButton
                    title="Saqlash"
                    onPress={handleSave}
                    isLoading={loading}
                    gradient={['#667eea', '#764ba2']}
                    style={{ flex: 1 }}
                />
            }
        >
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                    {avatar && (!Platform.OS === 'web' || !avatar.startsWith('file://')) ? (
                        <Image source={{ uri: avatar }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
                        </View>
                    )}
                    <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
                        <Ionicons name="camera" size={16} color="white" />
                    </View>
                </TouchableOpacity>
            </View>

            <PremiumInput
                label="Ism Familigangiz"
                placeholder="Ismingizni kiriting"
                value={name}
                onChangeText={setName}
                icon="person-outline"
            />

            <PremiumInput
                label="Telefon Raqam"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="call-outline"
            />

            <PremiumInput
                label="Email"
                placeholder="example@mail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon="mail-outline"
            />
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 20, fontWeight: 'bold' },
    avatarContainer: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative' },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, color: 'white', fontWeight: 'bold' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary,
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'white'
    },
    inputGroup: { marginBottom: 15 },
    label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
    input: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16 }
});

export default EditProfileModal;
