import React, { useContext, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Modal, Alert, ActivityIndicator, Dimensions,
    Platform, ScrollView, StatusBar, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';

import { SchoolContext } from '../../context/SchoolContext';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { getThemeColors, COLORS, SPACING } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { SETTINGS } from '../../config/settings';

const { width } = Dimensions.get('window');

const VideosScreen = ({ navigation }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const { userInfo } = useContext(AuthContext);
    const { videos, addVideo, deleteVideo, updateVideo, courses } = useContext(SchoolContext);
    const colors = getThemeColors(isDarkMode);

    const isStaff = userInfo?.role === 'admin' || userInfo?.role === 'teacher';

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('all');

    // Background Upload State
    const [fileToUpload, setFileToUpload] = useState(null);
    const [activeUploads, setActiveUploads] = useState({}); // { docId: progress }

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const MAX_SIZE = 200 * 1024 * 1024;

            if (asset.fileSize && asset.fileSize > MAX_SIZE) {
                Alert.alert("Video hajmi juda katta", "Maksimal hajm 200MB.");
                return;
            }

            setFileToUpload(asset);
            setUrl(''); // Clear manual URL if file is picked
        }
    };

    const uploadVideoBackground = async (docId, asset) => {
        let uploadUrl = 'https://catbox.moe/user/api.php';
        if (Platform.OS === 'web') {
            uploadUrl = 'https://cors-anywhere.herokuapp.com/' + uploadUrl;
        }

        const uri = asset.uri;

        try {
            if (Platform.OS === 'web') {
                // Web still uses XMLHttpRequest for progress tracking easily
                const formData = new FormData();
                formData.append('reqtype', 'fileupload');
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('fileToUpload', blob, 'video.mp4');

                const xhr = new XMLHttpRequest();
                xhr.open('POST', uploadUrl);
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        let progress = Math.round((e.loaded / e.total) * 100);
                        setActiveUploads(prev => ({ ...prev, [docId]: progress }));
                    }
                });

                xhr.onreadystatechange = async () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            const responseText = xhr.responseText.trim();
                            if (responseText.startsWith('http')) {
                                await updateVideo(docId, { url: responseText, status: 'ready' });
                            } else {
                                await updateVideo(docId, { status: 'error', error: responseText });
                            }
                        } else {
                            await updateVideo(docId, { status: 'error' });
                        }
                        setActiveUploads(prev => {
                            const next = { ...prev };
                            delete next[docId];
                            return next;
                        });
                    }
                };
                xhr.send(formData);
            } else {
                // Native uses FileSystem for better background stability
                const uploadTask = FileSystem.createUploadTask(
                    uploadUrl,
                    uri,
                    {
                        httpMethod: 'POST',
                        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                        fieldName: 'fileToUpload',
                        parameters: {
                            reqtype: 'fileupload',
                        },
                    },
                    (progress) => {
                        const p = Math.round((progress.totalBytesSent / progress.totalBytesExpectedToSend) * 100);
                        setActiveUploads(prev => ({ ...prev, [docId]: p }));
                    }
                );

                const result = await uploadTask.uploadAsync();

                if (result.status === 200) {
                    const responseText = result.body.trim();
                    if (responseText.startsWith('http')) {
                        await updateVideo(docId, { url: responseText, status: 'ready' });
                    } else {
                        await updateVideo(docId, { status: 'error', error: responseText });
                    }
                } else {
                    await updateVideo(docId, { status: 'error' });
                }

                setActiveUploads(prev => {
                    const next = { ...prev };
                    delete next[docId];
                    return next;
                });
            }
        } catch (e) {
            console.error("Upload error:", e);
            await updateVideo(docId, { status: 'error' });
            setActiveUploads(prev => {
                const next = { ...prev };
                delete next[docId];
                return next;
            });
        }
    };

    const handleAddVideo = async () => {
        if (!title || (!url && !fileToUpload)) {
            Alert.alert("Xatolik", "Sarlavha va Video kiritish/tanlash majburiy");
            return;
        }

        setLoading(true);
        try {
            const videoData = {
                title,
                description,
                courseId: selectedCourseId,
                author: userInfo.name,
                views: 0,
                status: fileToUpload ? 'uploading' : 'ready',
                url: url || ''
            };

            const docId = await addVideo(videoData);

            if (fileToUpload && docId) {
                uploadVideoBackground(docId, fileToUpload);
            }

            setModalVisible(false);
            setTitle('');
            setUrl('');
            setDescription('');
            setFileToUpload(null);
        } catch (e) {
            Alert.alert("Xatolik", "Saqlashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id) => {
        Alert.alert(
            "O'chirish",
            "Ushbu videoni o'chirishni xohlaysizmi?",
            [
                { text: "Yo'q", style: "cancel" },
                { text: "Ha", style: "destructive", onPress: () => deleteVideo(id) }
            ]
        );
    };

    const onPlaybackStatusUpdate = (status) => {
        if (status.error) {
            setVideoLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Video Darslar</Text>
            {isStaff ? (
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                    <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 40 }} />
            )}
        </View>
    );

    const renderVideoCard = ({ item }) => {
        const isUploading = item.status === 'uploading';
        const progress = activeUploads[item.id] || 0;
        const isError = item.status === 'error';

        return (
            <TouchableOpacity
                style={[styles.videoCard, { backgroundColor: colors.surface }]}
                onPress={() => !isUploading && !isError && setSelectedVideo(item)}
                activeOpacity={isUploading ? 1 : 0.9}
            >
                <View style={styles.thumbnailPlaceholder}>
                    <LinearGradient
                        colors={['#1a1a1a', '#333']}
                        style={styles.thumbGradient}
                    >
                        {isUploading ? (
                            <View style={styles.cardUploadProgress}>
                                <ActivityIndicator color={COLORS.primary} size="large" />
                                <Text style={styles.cardUploadText}>{progress}%</Text>
                            </View>
                        ) : isError ? (
                            <Ionicons name="alert-circle" size={50} color="#ff4757" />
                        ) : (
                            <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.7)" />
                        )}
                    </LinearGradient>
                    {isStaff && (
                        <TouchableOpacity
                            style={styles.deleteBadge}
                            onPress={() => confirmDelete(item.id)}
                        >
                            <Ionicons name="trash" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.videoInfo}>
                    <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.row}>
                        <Text style={[styles.videoMeta, { color: colors.textSecondary }]}>
                            {item.courseId === 'all' ? 'Barcha uchun' : courses.find(c => c.id === item.courseId)?.title || 'Guruh'}
                        </Text>
                        {isUploading && (
                            <Text style={[styles.statusBadge, { color: COLORS.primary }]}>Yuklanmoqda...</Text>
                        )}
                        {isError && (
                            <Text style={[styles.statusBadge, { color: '#ff4757' }]}>Xatolik</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const AddVideoModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setModalVisible(false)}
                />
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Yangi Video</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sarlavha</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Masalan: 1-dars Kirish"
                            placeholderTextColor={colors.textTertiary}
                        />

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Video</Text>
                        <View style={styles.videoInputContainer}>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, flex: 1, marginBottom: 0 }]}
                                value={url}
                                onChangeText={setUrl}
                                placeholder="https://... yoki Video yuklang"
                                autoCapitalize="none"
                                placeholderTextColor={colors.textTertiary}
                            />
                            <TouchableOpacity
                                style={[styles.uploadBtn, { backgroundColor: colors.background }]}
                                onPress={pickVideo}
                                disabled={loading}
                            >
                                <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {fileToUpload && (
                            <View style={styles.selectedFilePill}>
                                <Ionicons name="videocam" size={16} color={COLORS.primary} />
                                <Text style={[styles.selectedFileName, { color: colors.text }]}>
                                    Video tanlandi: {(fileToUpload.fileSize / (1024 * 1024)).toFixed(1)}MB
                                </Text>
                                <TouchableOpacity onPress={() => setFileToUpload(null)}>
                                    <Ionicons name="close-circle" size={18} color="#ff4757" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.tipText}>Tip: Video faylni to'g'ridan-to'g'ri yuklash uchun tepaga bosing.</Text>

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tavsif (ixtiyoriy)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Dars haqida ma'lumot..."
                            multiline
                            numberOfLines={4}
                            placeholderTextColor={colors.textTertiary}
                        />

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kimlar uchun?</Text>
                        <View style={styles.courseSelect}>
                            <TouchableOpacity
                                style={[styles.coursePill, selectedCourseId === 'all' && styles.coursePillActive]}
                                onPress={() => setSelectedCourseId('all')}
                            >
                                <Text style={[styles.coursePillText, selectedCourseId === 'all' && styles.coursePillTextActive]}>Hamma</Text>
                            </TouchableOpacity>
                            {courses.map(course => (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[styles.coursePill, selectedCourseId === course.id && styles.coursePillActive]}
                                    onPress={() => setSelectedCourseId(course.id)}
                                >
                                    <Text style={[styles.coursePillText, selectedCourseId === course.id && styles.coursePillTextActive]}>
                                        {course.title.substring(0, 10)}...
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: COLORS.primary }]}
                            onPress={handleAddVideo}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Saqlash</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal >
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                {renderHeader()}

                {selectedVideo && (
                    <View style={styles.playerWrapper}>
                        <Video
                            source={{ uri: selectedVideo.url }}
                            rate={1.0}
                            volume={1.0}
                            isMuted={false}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                            useNativeControls
                            style={styles.videoPlayer}
                            onLoadStart={() => setVideoLoading(true)}
                            onLoad={() => setVideoLoading(false)}
                            onReadyForDisplay={() => setVideoLoading(false)}
                            onError={(e) => {
                                setVideoLoading(false);
                                Alert.alert("Xatolik", "Videoni yuklashda xatolik yuz berdi. Manzilni tekshiring.");
                            }}
                        />
                        {videoLoading && (
                            <View style={styles.videoLoader}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        )}
                        <View style={[styles.playerInfo, { backgroundColor: colors.surface }]}>
                            <View style={styles.row}>
                                <Text style={[styles.playerTitle, { color: colors.text }]}>{selectedVideo.title}</Text>
                                <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.playerDesc, { color: colors.textSecondary }]}>
                                {selectedVideo.description || "Tavsif yo'q"}
                            </Text>
                        </View>
                    </View>
                )}

                <FlatList
                    data={videos}
                    keyExtractor={item => item.id}
                    renderItem={renderVideoCard}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="videocam-outline" size={64} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Hozircha videolar yo'q</Text>
                        </View>
                    }
                />
            </SafeAreaView>

            <AddVideoModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    backBtn: { width: 40 },
    addBtn: { width: 40, alignItems: 'center' },
    listContainer: { padding: 20 },
    videoCard: {
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: 180,
        backgroundColor: '#000',
    },
    thumbGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoInfo: { padding: 15 },
    videoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 5 },
    videoMeta: { fontSize: 13 },
    deleteBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#eb2f06',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerWrapper: {
        width: '100%',
        backgroundColor: '#000',
    },
    videoPlayer: {
        width: '100%',
        height: 250,
    },
    playerInfo: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    playerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
    playerDesc: { fontSize: 14, marginTop: 8 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, marginTop: 10 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25, // Safe area
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    inputLabel: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    courseSelect: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    coursePill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    coursePillActive: { backgroundColor: COLORS.primary },
    coursePillTextActive: { color: '#fff', fontWeight: 'bold' },
    submitBtn: {
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    tipText: { fontSize: 12, color: '#F2994A', marginBottom: 16, fontStyle: 'italic' },
    videoInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    uploadBtn: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    progressContainer: {
        height: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
        justifyContent: 'center',
    },
    progressBar: {
        height: '100%',
    },
    progressText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        fontSize: 10,
        fontWeight: 'bold',
    },
    sizeStats: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: -12,
        marginBottom: 16,
        fontWeight: '600',
    },
    selectedFilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8
    },
    selectedFileName: {
        fontSize: 13,
        flex: 1,
        fontWeight: '500'
    },
    cardUploadProgress: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardUploadText: {
        color: '#fff',
        marginTop: 5,
        fontWeight: 'bold',
        fontSize: 14
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 8
    },
    videoLoader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        height: 250, // Matches videoPlayer height
    }
});

export default VideosScreen;
