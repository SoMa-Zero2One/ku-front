'use client';

import { useAuth } from '@/contexts/AuthContext';
import { mockUniversities, getUserById, updateUserApplications } from '@/data/mockData';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { University, AppliedUniversity } from '@/types';
import Header from '@/components/Header';

export default function EditApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedUniversities, setSelectedUniversities] = useState<AppliedUniversity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [customUniversities, setCustomUniversities] = useState<University[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<University[]>([]);
  const [selectedUniversityToAdd, setSelectedUniversityToAdd] = useState<University | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      const userData = getUserById(user.id);
      if (userData) {
        setSelectedUniversities([...userData.appliedUniversities]);
      }
    }
  }, [user]);


  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const userData = getUserById(user.id);
  if (!userData) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-red-600">사용자 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  // 편집 제한 체크
  const canEdit = userData.editCount < userData.maxEditCount && !userData.isDeadlineRestricted;
  const remainingEdits = userData.maxEditCount - userData.editCount;

  const handleUniversityToggle = (universityId: string) => {
    if (!canEdit) return;

    setSelectedUniversities(prev => {
      const isAlreadySelected = prev.some(app => app.universityId === universityId);
      
      if (isAlreadySelected) {
        // 선택 해제: 해당 대학교 제거 후 순위 재정렬
        const filtered = prev.filter(app => app.universityId !== universityId);
        return filtered.map((app, index) => ({ ...app, rank: index + 1 }));
      } else {
        // 5개 제한 체크 (UI에서 이미 막혀있으므로 실행되지 않을 것)
        if (prev.length >= 5) {
          return prev;
        }
        
        // 선택: 가장 뒤 순위로 추가
        const nextRank = prev.length + 1;
        return [...prev, { universityId, rank: nextRank }];
      }
    });
  };

  const handleSubmit = async () => {
    if (!canEdit) return;
    
    setIsSubmitting(true);
    
    try {
      // 실제 구현에서는 API 호출
      // 여기서는 mock 데이터 업데이트 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock 데이터 업데이트
      const success = updateUserApplications(user.id, selectedUniversities);
      
      if (success) {
        setMessage({ type: 'success', text: '지원 대학교가 성공적으로 변경되었습니다!' });
        
        // 3초 후 프로필 페이지로 이동
        setTimeout(() => {
          router.push(`/profile/${user.id}`);
        }, 3000);
      } else {
        throw new Error('업데이트 실패');
      }
      
    } catch (error) {
      setMessage({ type: 'error', text: '변경 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = JSON.stringify(selectedUniversities.sort((a, b) => a.rank - b.rank)) !== JSON.stringify(userData.appliedUniversities.sort((a, b) => a.rank - b.rank));

  // 전체 대학교 목록 (기존 + 사용자 추가)
  const allUniversities = [...mockUniversities, ...customUniversities];

  // Mock API - 대학교 검색 (실제로는 백엔드 API 호출)
  const searchUniversities = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // 실제 구현에서는 백엔드 API 호출
    await new Promise(resolve => setTimeout(resolve, 300)); // 네트워크 지연 시뮬레이션
    
    // Mock 검색 결과 (실제로는 API 응답)
    const mockSearchResults: University[] = [
      {
        id: `search-1-${Date.now()}`,
        name: 'Stanford University',
        country: '미국',
        flag: '🇺🇸',
        competitionRatio: { level1: 5, level2: 3 },
        notices: [],
        applicantCount: 0
      },
      {
        id: `search-2-${Date.now()}`,
        name: 'University of Cambridge',
        country: '영국',
        flag: '🇬🇧',
        competitionRatio: { level1: 4, level2: 2 },
        notices: [],
        applicantCount: 0
      },
      {
        id: `search-3-${Date.now()}`,
        name: 'Seoul National University',
        country: '대한민국',
        flag: '🇰🇷',
        competitionRatio: { level1: 10, level2: 5 },
        notices: [],
        applicantCount: 0
      },
    ].filter(uni => 
      uni.name.toLowerCase().includes(query.toLowerCase()) ||
      uni.country.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(mockSearchResults);
    setIsSearching(false);
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setSelectedUniversityToAdd(null);
    searchUniversities(query);
  };

  // 검색 결과에서 대학교 선택
  const handleSelectSearchResult = (university: University) => {
    setSelectedUniversityToAdd(university);
    setSearchResults([]);
    setSearchQuery('');
  };

  // 확인 후 대학교 추가
  const handleConfirmAddUniversity = () => {
    if (!selectedUniversityToAdd) return;

    // 5개 제한 체크 (UI에서 이미 막혀있으므로 실행되지 않을 것)
    if (selectedUniversities.length >= 5) {
      return;
    }

    const customId = `custom-${Date.now()}`;
    const university: University = {
      ...selectedUniversityToAdd,
      id: customId
    };

    setCustomUniversities(prev => [...prev, university]);
    setSelectedUniversityToAdd(null);
    setShowAddForm(false);
    setMessage({ type: 'success', text: `${university.name}이(가) 추가되었습니다!` });
    
    // 추가된 대학교를 자동으로 선택 (가장 뒤 순위로)
    setSelectedUniversities(prev => {
      const nextRank = prev.length + 1;
      return [...prev, { universityId: customId, rank: nextRank }];
    });
  };

  // 추가 폼 취소
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUniversityToAdd(null);
  };




  return (
    <div className="min-h-screen bg-transparent">
      <Header 
        title="지원 대학교 변경"
        showBackButton={true}
        backButtonText="← 돌아가기"
        backUrl={`/profile/${user.id}`}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 안내 메시지 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 편집 안내</h2>
          
          {canEdit ? (
            <div className="space-y-2">
              <p className="text-green-700">✅ 편집 가능한 상태입니다.</p>
              <p className="text-sm text-gray-600">• 남은 편집 횟수: <span className="font-semibold">{remainingEdits}회</span></p>
              <p className="text-sm text-gray-600">• 원하는 대학교를 선택하고 저장하세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700">❌ 편집할 수 없습니다.</p>
              {userData.editCount >= userData.maxEditCount && (
                <p className="text-sm text-gray-600">• 편집 횟수를 모두 사용했습니다.</p>
              )}
              {userData.isDeadlineRestricted && (
                <p className="text-sm text-gray-600">• 마감일이 임박하여 편집이 제한됩니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`rounded-lg p-4 mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 선택된 대학교 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-8">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  나의 지원 목록 ({selectedUniversities.length}/5개)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  선택한 순서대로 순위가 정해집니다. 최대 5개까지 선택 가능합니다.
                </p>
                {selectedUniversities.length >= 5 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    ⚠️ 최대 선택 개수에 도달했습니다. 다른 대학교를 선택하려면 기존 선택을 해제해주세요.
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedUniversities.length > 0 ? (
                  selectedUniversities
                    .sort((a, b) => a.rank - b.rank)
                    .map((app) => {
                      const university = allUniversities.find(u => u.id === app.universityId);
                      if (!university) return null;
                      
                      return (
                        <div
                          key={app.universityId}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                              app.rank === 1 ? 'bg-yellow-500' :
                              app.rank === 2 ? 'bg-gray-400' :
                              app.rank === 3 ? 'bg-amber-600' :
                              'bg-blue-500'
                            }`}>
                              {app.rank}
                            </span>
                            <span className="text-2xl">{university.flag}</span>
                            <div>
                              <div className="font-medium text-gray-800">{university.name}</div>
                              <div className="text-xs text-gray-500">{university.country}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">선택된 대학교가 없습니다.</p>
                    <p className="text-sm text-gray-400 mt-1">오른쪽 목록에서 대학교를 선택해주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 대학교 선택 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      지원 가능 대학교
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      지원할 대학교를 선택하세요. 목록에 없으면 직접 추가할 수 있습니다.
                    </p>
                  </div>
                  
                  <div className="mt-4 sm:mt-0">
                    <button
                      onClick={() => setShowAddForm(true)}
                      disabled={!canEdit}
                      className={`inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
                        canEdit 
                          ? 'text-green-700 bg-green-50 hover:bg-green-100' 
                          : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      새 대학교 추가
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* 새 대학교 추가 폼 */}
                {showAddForm && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">새 대학교 검색 및 추가</h3>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">대학교 이름으로 검색</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                          placeholder="예: Stanford University, Cambridge, 서울대학교..."
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {searchResults.map((university) => (
                            <button
                              key={university.id}
                              onClick={() => handleSelectSearchResult(university)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{university.flag}</span>
                                <div>
                                  <div className="font-medium text-gray-900">{university.name}</div>
                                  <div className="text-sm text-gray-500">{university.country}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedUniversityToAdd && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="text-md font-medium text-gray-900 mb-3">추가할 대학교 정보를 확인해주세요</h4>
                        <div className="flex items-start space-x-4">
                          <span className="text-4xl">{selectedUniversityToAdd.flag}</span>
                          <div className="flex-1">
                            <h5 className="text-lg font-semibold text-gray-900">{selectedUniversityToAdd.name}</h5>
                            <p className="text-gray-600 mb-2">{selectedUniversityToAdd.country}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-3 mt-4">
                      <button onClick={handleCancelAdd} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">취소</button>
                      {selectedUniversityToAdd && (
                        <button onClick={handleConfirmAddUniversity} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">이 대학교 추가하기</button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allUniversities.map((university) => {
                    const selectedApp = selectedUniversities.find(app => app.universityId === university.id);
                    const isSelected = !!selectedApp;
                    const isCustom = university.id.startsWith('custom-');
                    const isMaxReached = selectedUniversities.length >= 5 && !isSelected;
                    
                    return (
                      <div
                        key={university.id}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                            : isMaxReached
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'  
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''} ${
                          isCustom ? 'border-green-300 bg-green-25' : ''
                        }`}
                        onClick={() => {
                          if (canEdit && !isMaxReached) {
                            handleUniversityToggle(university.id);
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <span className="text-3xl">{university.flag}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium text-gray-900 truncate">{university.name}</h3>
                                {isCustom && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">직접 추가</span>
                                )}
                              </div>
                              {isSelected && selectedApp && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{selectedApp.rank}순위</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 mb-2">{university.country}</p>
                            <div className="text-sm text-gray-500">
                              <p>지원자: {university.applicantCount}명</p>
                              <p>모집인원: {university.competitionRatio.level1 + university.competitionRatio.level2}명</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 pt-6 border-t flex justify-center space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!canEdit || !hasChanges || isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canEdit && hasChanges && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </>
            ) : (
              '변경 저장'
            )}
          </button>
        </div>
      </main>

    </div>
  );
} 