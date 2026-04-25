import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import type { Course, CreateCourseRequest } from '@shared/types/api';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const COLORS = [
  { label: '蓝色', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  { label: '绿色', value: 'green', bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  { label: '紫色', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  { label: '橙色', value: 'orange', bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
  { label: '红色', value: 'red', bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
  { label: '青色', value: 'teal', bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800' },
];

function getColorClasses(color: string) {
  return COLORS.find(c => c.value === color) ?? COLORS[0];
}

const EMPTY_FORM: CreateCourseRequest = {
  name: '',
  teacher: '',
  location: '',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:40',
  color: 'blue',
};

export default function ScheduleView({ onRefresh }: { onRefresh: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CreateCourseRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getCourses();
      if (res.success) setCourses(res.data);
    } catch {
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      teacher: course.teacher,
      location: course.location,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      color: course.color,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.teacher.trim() || !form.location.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }
    setSaving(true);
    try {
      if (editingCourse) {
        const res = await apiService.updateCourse(editingCourse.id, form);
        if (res.success) {
          toast.success('课程已更新');
          fetchCourses();
          onRefresh();
          setShowForm(false);
        }
      } else {
        const res = await apiService.createCourse(form);
        if (res.success) {
          toast.success('课程已添加');
          fetchCourses();
          onRefresh();
          setShowForm(false);
        }
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这门课程吗？')) return;
    try {
      const res = await apiService.deleteCourse(id);
      if (res.success) {
        toast.success('课程已删除');
        fetchCourses();
        onRefresh();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setShowCamera(true);
      }
    } catch (err) {
      toast.error('无法访问相机，请检查权限设置或使用上传图片功能');
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
      }
    }
  };

  const processImageWithOCR = async (imageData: string) => {
    setOcrProcessing(true);
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(imageData, 'eng+chi', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      const extractedCourses = parseCourseText(text);
      
      if (extractedCourses.length > 0) {
        toast.success(`识别到 ${extractedCourses.length} 门课程`);
        setForm(extractedCourses[0]);
        setShowForm(true);
      } else {
        toast.error('未识别到课程信息，请手动输入');
        setShowForm(true);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('图片识别失败，请手动输入课程信息');
      setShowForm(true);
    } finally {
      setOcrProcessing(false);
      stopCamera();
    }
  };

  const parseCourseText = (text: string): CreateCourseRequest[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const courses: CreateCourseRequest[] = [];
    
    const dayMap: { [key: string]: number } = {
      '周日': 0, '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6,
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
    };
    
    const timeRegex = /(\d{1,2})[:：](\d{2})\s*[-~至]\s*(\d{1,2})[:：](\d{2})/;
    
    for (const line of lines) {
      const timeMatch = line.match(timeRegex);
      let dayOfWeek = 1;
      let startTime = '09:00';
      let endTime = '10:40';
      
      if (timeMatch) {
        startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
      }
      
      for (const [day, num] of Object.entries(dayMap)) {
        if (line.includes(day)) {
          dayOfWeek = num;
          break;
        }
      }
      
      const cleanLine = line.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').trim();
      if (cleanLine.length >= 2) {
        courses.push({
          name: cleanLine.substring(0, 20),
          teacher: '待定',
          location: '待定',
          dayOfWeek,
          startTime,
          endTime,
          color: COLORS[courses.length % COLORS.length].value,
        });
      }
    }
    
    return courses.slice(0, 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        await processImageWithOCR(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const displayedCourses = viewMode === 'day'
    ? courses.filter(c => c.dayOfWeek === selectedDay)
    : courses;

  const coursesByDay = DAYS.map((_, i) => courses.filter(c => c.dayOfWeek === i));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === 'week' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === 'day' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            日视图
          </button>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A9F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加课程
        </button>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          拍照识别
        </button>
      </div>

      {/* Day selector for day view */}
      {viewMode === 'day' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedDay === i
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Week View */}
      {!loading && viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS.map((day, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#D1DDE8] overflow-hidden">
              <div className={`px-3 py-2 text-center text-xs font-bold ${
                i === new Date().getDay() ? 'bg-[#1E3A5F] text-white' : 'bg-[#F0F4F8] text-[#5A7A99]'
              }`}>
                {day}
              </div>
              <div className="p-2 space-y-2 min-h-[80px]">
                {coursesByDay[i].length === 0 ? (
                  <p className="text-xs text-[#5A7A99] text-center py-3">无课</p>
                ) : (
                  coursesByDay[i].map(course => {
                    const cc = getColorClasses(course.color);
                    return (
                      <div
                        key={course.id}
                        className={`${cc.bg} rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => openEdit(course)}
                      >
                        <p className={`text-xs font-bold ${cc.text} leading-tight`}>{course.name}</p>
                        <p className="text-xs text-[#5A7A99] mt-0.5">{course.startTime}-{course.endTime}</p>
                        <p className="text-xs text-[#5A7A99]">{course.location}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Day View */}
      {!loading && viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-[#D1DDE8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D1DDE8]">
            <h2 className="text-base font-bold text-[#0F1F33]">{DAYS[selectedDay]} 课程安排</h2>
          </div>
          <div className="p-6 space-y-3">
            {displayedCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-[#5A7A99] text-sm">今天没有课程</p>
                <button onClick={openCreate} className="mt-3 text-[#2D6A9F] text-sm font-medium hover:underline">添加课程</button>
              </div>
            ) : (
              displayedCourses.map(course => {
                const cc = getColorClasses(course.color);
                return (
                  <div key={course.id} className="flex gap-4 items-start">
                    <div className="text-right w-16 flex-shrink-0">
                      <p className="text-xs font-bold text-[#5A7A99]">{course.startTime}</p>
                      <p className="text-xs text-[#5A7A99]">{course.endTime}</p>
                    </div>
                    <div className={`flex-1 ${cc.bg} rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-bold ${cc.text}`}>{course.name}</p>
                          <p className="text-xs text-[#5A7A99] mt-0.5">{course.location} · {course.teacher}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEdit(course)}
                            className="text-xs text-[#2D6A9F] hover:underline"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#D1DDE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F1F33]">{editingCourse ? '编辑课程' : '添加课程'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#5A7A99] hover:text-[#0F1F33]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">课程名称 *</label>
                <input
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例：数据结构与算法"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">授课教师 *</label>
                  <input
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.teacher}
                    onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                    placeholder="张教授"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">上课地点 *</label>
                  <input
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="A301"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">星期</label>
                <select
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] bg-white"
                  value={form.dayOfWeek}
                  onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">开始时间</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">结束时间</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-2">颜色标签</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      className={`w-8 h-8 rounded-full ${c.bg} border-2 transition-all ${
                        form.color === c.value ? 'border-[#1E3A5F] scale-110' : 'border-transparent'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1DDE8] flex gap-3 justify-end">
              {editingCourse && (
                <button
                  onClick={() => { handleDelete(editingCourse.id); setShowForm(false); }}
                  className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  删除
                </button>
              )}
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-[#5A7A99] hover:bg-[#F0F4F8] rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#2D6A9F] transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D1DDE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F1F33]">拍照识别课程</h3>
              <button onClick={stopCamera} className="text-[#5A7A99] hover:text-[#0F1F33]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {!capturedImage ? (
                <div className="relative bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-auto"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-[#1E3A5F] flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1E3A5F]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <img src={capturedImage} alt="Captured" className="w-full rounded-xl" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-[#5A7A99] bg-[#F0F4F8] rounded-xl hover:bg-[#E0E8F0] transition-colors"
                    >
                      重新拍照
                    </button>
                    <button
                      onClick={() => processImageWithOCR(capturedImage)}
                      disabled={ocrProcessing}
                      className="flex-1 px-4 py-2 text-sm font-semibold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#2D6A9F] transition-colors disabled:opacity-50"
                    >
                      {ocrProcessing ? '识别中...' : '开始识别'}
                    </button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-800">
                  💡 提示：请确保课表图片清晰，光线充足，可以提高识别准确率。支持中英文课表识别。
                </p>
              </div>
              <div className="mt-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 text-sm font-semibold text-[#2D6A9F] bg-white border border-[#2D6A9F] rounded-xl hover:bg-blue-50 transition-colors"
                >
                  从相册选择图片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
