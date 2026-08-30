// pages/Admin/AdminSchedule.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaCalendarAlt,
  FaClock,
  FaCalendarCheck,
  FaCheckCircle,
  FaEye,
  FaSearch,
  FaSyncAlt,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaHardHat,
  FaClipboardList,
  FaFileAlt,
  FaTimes,
  FaUserCog,
  FaChevronLeft,
  FaChevronRight,
  FaMoneyBillWave,
  FaProjectDiagram,
  FaMicrochip
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/schedule.css';

// ============================================================
// REUSABLE HORIZONTAL WORKFLOW TIMELINE COMPONENT - IMPROVED
// ============================================================
const WorkflowTimeline = ({ steps, progress }) => {
  return (
    <div className="workflow-timeline-horizontal">
      <div className="timeline-steps-horizontal">
        {steps.map((step, index) => (
          <div key={step.key || index} className="timeline-step-horizontal">
            <div className="timeline-marker-horizontal">
              {step.status === 'completed' && (
                <FaCheckCircle className="marker-icon-horizontal completed" />
              )}
              {step.status === 'current' && (
                <div className="marker-dot-horizontal current" />
              )}
              {step.status === 'upcoming' && (
                <div className="marker-dot-horizontal upcoming" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`timeline-connector-horizontal ${step.status === 'completed' ? 'completed' : ''}`} />
            )}
            <div className="timeline-content-horizontal">
              <div className="timeline-title-horizontal">{step.title}</div>
              <div className="timeline-status-horizontal">
                {step.status === 'completed' && '✓ Completed'}
                {step.status === 'current' && '● In Progress'}
                {step.status === 'upcoming' && '○ Upcoming'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="timeline-progress-text">
        <span>Overall Progress: <strong>{progress}%</strong></span>
        <div className="timeline-progress-bar">
          <div className="timeline-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const AdminSchedule = () => {
  const { toast, showToast, hideToast } = useToast();

  // ============================================================
  // STATE
  // ============================================================
  const [loading, setLoading] = useState(true);
  const [allSchedules, setAllSchedules] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Tabs: ONLY Pre-Assessment and Installation
  const [activeTab, setActiveTab] = useState('pre_assessment');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // KPI stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    confirmed: 0,
    completed: 0
  });

  // All projects for timeline data (ADMIN-WIDE - ALL ENGINEERS)
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search timeout ref
  const searchTimeoutRef = React.useRef(null);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchDataForTab();
  }, [activeTab]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchDataForTab();
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // ============================================================
  // DATA FETCHING - ADMIN-WIDE (ALL ENGINEERS)
  // ============================================================
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDataForTab(),
        fetchStats(),
        fetchAllProjects()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataForTab = async () => {
    try {
      if (activeTab === 'pre_assessment') {
        await fetchPreAssessmentSchedules();
      } else {
        await fetchInstallationProjects();
      }
    } catch (error) {
      console.error('Error fetching data for tab:', error);
    }
  };

  // ============================================================
  // PRE-ASSESSMENT: Fetch from Schedules API + Check Device Deployment & Report Draft
  // ============================================================
  const fetchPreAssessmentSchedules = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch ALL pre-assessment schedules
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: 'pre_assessment',
          limit: 10000
        }
      });

      const allData = response.data.schedules || [];
      
      console.log('[SCHEDULES] Total schedules:', allData.length);
      
      // Fetch ALL pre-assessments to check for deployment and report_draft
      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10000 }
      });
      
      const preAssessments = preAssessmentsRes.data.assessments || [];
      
      // Create a map of assessment ID -> data
      const assessmentMap = {};
      preAssessments.forEach(assessment => {
        const isDeployed = assessment.deviceDeployedAt ? true : false;
        
        // Check if report_draft or completed
        const isReportDraft = assessment.assessmentStatus === 'report_draft' || 
                              assessment.assessmentStatus === 'report_drafted' ||
                              assessment.assessmentStatus === 'completed' ||
                              assessment.assessmentStatus === 'quoted' ||
                              assessment.assessmentStatus === 'quotation_generated';
        
        assessmentMap[assessment._id] = {
          isDeployed: isDeployed,
          isReportDraft: isReportDraft,
          deployedAt: assessment.deviceDeployedAt || null,
          assessmentStatus: assessment.assessmentStatus || null
        };
        
        console.log(`[ASSESSMENT] ${assessment._id} - Deployed: ${isDeployed}, ReportDraft: ${isReportDraft}, Status: ${assessment.assessmentStatus}`);
      });
      
      console.log('[ASSESSMENT MAP] Keys:', Object.keys(assessmentMap).length);
      
      // Enrich each schedule
      const enrichedData = allData.map(schedule => {
        // Find the assessment ID from the schedule
        let assessmentId = null;
        
        if (schedule.preAssessmentId) {
          if (typeof schedule.preAssessmentId === 'object' && schedule.preAssessmentId._id) {
            assessmentId = schedule.preAssessmentId._id.toString();
          } else if (typeof schedule.preAssessmentId === 'string') {
            assessmentId = schedule.preAssessmentId;
          }
        }
        
        // If no preAssessmentId, try using schedule._id
        if (!assessmentId) {
          assessmentId = schedule._id.toString();
        }
        
        // Get assessment data
        const assessmentData = assessmentMap[assessmentId] || null;
        
        // ALWAYS start with the schedule's original status
        let finalStatus = schedule.status;
        let isDeviceDeployed = false;
        let deviceDeployedAt = null;
        let isReportDraft = false;
        
        if (assessmentData) {
          isDeviceDeployed = assessmentData.isDeployed;
          deviceDeployedAt = assessmentData.deployedAt;
          isReportDraft = assessmentData.isReportDraft;
          
          // PRIORITY 1: If report_draft -> show as COMPLETED
          if (isReportDraft) {
            finalStatus = 'completed';
            console.log(`[ENRICH] Schedule ${schedule._id} -> REPORT_DRAFT -> COMPLETED, status: completed`);
          }
          // PRIORITY 2: If device deployed but not report_draft -> show device_deployed
          else if (isDeviceDeployed) {
            finalStatus = 'device_deployed';
            console.log(`[ENRICH] Schedule ${schedule._id} -> Device DEPLOYED, status: device_deployed`);
          }
          // PRIORITY 3: Use schedule status
          else {
            finalStatus = schedule.status;
            console.log(`[ENRICH] Schedule ${schedule._id} -> Using schedule status: ${finalStatus}`);
          }
        } else {
          // No assessment found, use schedule status
          finalStatus = schedule.status;
          console.log(`[ENRICH] Schedule ${schedule._id} -> No assessment, status: ${finalStatus}`);
        }
        
        return {
          ...schedule,
          _enrichedStatus: finalStatus,
          _isDeviceDeployed: isDeviceDeployed,
          _deviceDeployedAt: deviceDeployedAt,
          _assessmentId: assessmentId,
          _isReportDraft: isReportDraft
        };
      });

      setAllSchedules(enrichedData);
      applyFilterAndPagination(enrichedData);

    } catch (error) {
      console.error('Error fetching pre-assessment schedules:', error);
      showToast('Failed to load pre-assessment schedules', 'error');
    }
  };

  // ============================================================
  // INSTALLATION: Fetch from Projects API (ADMIN-WIDE)
  // ============================================================
  const fetchInstallationProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 10000
        }
      });

      const allProjects = response.data.projects || [];

      const installationStatuses = ['in_progress', 'completed', 'full_paid', 'progress_paid'];
      const installationProjects = allProjects.filter(p => 
        installationStatuses.includes(p.status)
      );

      const transformedSchedules = installationProjects.map(project => ({
        _id: project._id,
        title: project.projectName || 'Installation Project',
        clientName: project.clientId?.contactFirstName && project.clientId?.contactLastName 
          ? `${project.clientId.contactFirstName} ${project.clientId.contactLastName}`
          : 'N/A',
        clientPhone: project.clientId?.contactNumber,
        clientEmail: project.clientId?.email,
        assignedEngineerId: project.assignedEngineerId,
        scheduledDate: project.startDate || project.createdAt || new Date(),
        scheduledTime: '09:00',
        type: 'installation',
        status: project.status,
        address: project.addressId,
        projectId: project._id,
        paymentPreference: project.paymentPreference,
        totalCost: project.totalCost,
        amountPaid: project.amountPaid,
        paymentSchedule: project.paymentSchedule,
        sitePhotos: project.sitePhotos,
        installationNotes: project.installationNotes,
        projectName: project.projectName,
        projectReference: project.projectReference,
        _projectData: project
      }));

      setAllSchedules(transformedSchedules);
      applyFilterAndPagination(transformedSchedules);

    } catch (error) {
      console.error('Error fetching installation projects:', error);
      showToast('Failed to load installation projects', 'error');
    }
  };

  // ============================================================
  // FILTER AND PAGINATION LOGIC
  // ============================================================
  const applyFilterAndPagination = useCallback((data) => {
    const searchLower = searchTerm.trim().toLowerCase();
    let filtered = data;

    if (searchLower) {
      filtered = data.filter(item => {
        const searchableText = [
          item.title,
          item.clientName,
          item.projectName,
          item.bookingReference,
          item.projectReference,
          item._id,
          item.status,
          item.assignedEngineerId?.firstName,
          item.assignedEngineerId?.lastName,
          item.assignedEngineerId?.fullName,
          item.projectReference,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    const totalFiltered = filtered.length;
    const totalFilteredPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
    
    const safePage = Math.min(currentPage, totalFilteredPages);
    if (safePage !== currentPage && totalFiltered > 0) {
      setCurrentPage(safePage);
    }

    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
    const paginated = filtered.slice(startIndex, endIndex);

    setSchedules(paginated);
    setTotalPages(totalFilteredPages);
    setTotalItems(totalFiltered);

  }, [searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    if (allSchedules.length > 0) {
      applyFilterAndPagination(allSchedules);
    }
  }, [searchTerm, currentPage, allSchedules, applyFilterAndPagination]);

  // ============================================================
  // UPDATE STATS - Count completed statuses properly
  // ============================================================
  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      // First, get the stats from API
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Then fetch all schedules to get enriched data and count completed properly
      const schedulesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: 'pre_assessment',
          limit: 10000
        }
      });
      
      const allSchedulesData = schedulesResponse.data.schedules || [];
      
      // Count completed statuses from enriched data
      let completedCount = 0;
      let upcomingCount = 0;
      let confirmedCount = 0;
      
      // Fetch pre-assessments to check report_draft
      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10000 }
      });
      
      const preAssessments = preAssessmentsRes.data.assessments || [];
      
      // Create map of assessment ID -> report_draft status
      const reportDraftMap = {};
      preAssessments.forEach(assessment => {
        const isReportDraft = assessment.assessmentStatus === 'report_draft' || 
                              assessment.assessmentStatus === 'report_drafted' ||
                              assessment.assessmentStatus === 'completed' ||
                              assessment.assessmentStatus === 'quoted' ||
                              assessment.assessmentStatus === 'quotation_generated';
        reportDraftMap[assessment._id] = isReportDraft;
      });
      
      allSchedulesData.forEach(schedule => {
        let status = schedule.status;
        
        // Check if schedule has preAssessmentId
        let assessmentId = null;
        if (schedule.preAssessmentId) {
          if (typeof schedule.preAssessmentId === 'object' && schedule.preAssessmentId._id) {
            assessmentId = schedule.preAssessmentId._id.toString();
          } else if (typeof schedule.preAssessmentId === 'string') {
            assessmentId = schedule.preAssessmentId;
          }
        }
        if (!assessmentId) {
          assessmentId = schedule._id.toString();
        }
        
        // If report_draft, count as completed
        if (reportDraftMap[assessmentId]) {
          status = 'completed';
        }
        
        if (status === 'completed') {
          completedCount++;
        } else if (status === 'scheduled' || status === 'confirmed') {
          upcomingCount++;
          confirmedCount++;
        } else if (status === 'pending') {
          upcomingCount++;
        }
      });
      
      const data = response.data.stats || {};
      setStats({
        total: data.total || allSchedulesData.length,
        upcoming: data.upcoming || upcomingCount,
        confirmed: data.confirmed || confirmedCount,
        completed: data.completed || completedCount
      });
      
      console.log('[STATS] Total:', allSchedulesData.length, 'Completed:', completedCount, 'Upcoming:', upcomingCount);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = sessionStorage.getItem('token');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      
      setProjects(response.data.projects || []);
      setLoadingProjects(false);
    } catch (error) {
      console.error('Error fetching all projects:', error);
      setLoadingProjects(false);
    }
  };

  // ============================================================
  // TIMELINE FUNCTIONS
  // ============================================================

  const isPaymentPaid = (project, paymentType) => {
    if (!project) return false;
    const scheduleItem = project.paymentSchedule?.find(p => p.type === paymentType);
    if (scheduleItem?.status === 'paid') return true;
    if (paymentType === 'full' && project.fullPaymentCompleted) return true;
    return false;
  };

  // ============================================================
  // PRE-ASSESSMENT TIMELINE - Handles completed, device_deployed
  // ============================================================
  const getPreAssessmentTimeline = (schedule) => {
    // ALWAYS start with schedule.status
    let status = schedule?.status || 'pending';
    
    // Check if we have enriched status
    if (schedule?._enrichedStatus) {
      status = schedule._enrichedStatus;
      console.log('[TIMELINE] Using enriched status:', status);
    } else {
      console.log('[TIMELINE] Using original schedule.status:', status);
    }
    
    console.log('[TIMELINE] Final status:', status);
    console.log('[TIMELINE] Is report draft:', schedule?._isReportDraft);
    console.log('[TIMELINE] Is device deployed:', schedule?._isDeviceDeployed);
    
    // ============================================================
    // If status is completed -> ALL STEPS COMPLETED
    // ============================================================
    if (status === 'completed') {
      console.log('[TIMELINE] Status is completed - all steps completed ✅');
      const allSteps = [
        { key: 'request_received', title: 'Request Received' },
        { key: 'approved_booking', title: 'Approved Booking' },
        { key: 'payment_received', title: 'Payment Received' },
        { key: 'scheduled_assessment', title: 'Scheduled Assessment' },
        { key: 'site_assessment', title: 'Site Assessment' },
        { key: 'assessment_completed', title: 'Assessment Completed' }
      ];
      return allSteps.map(step => ({ ...step, status: 'completed' }));
    }
    
    // ============================================================
    // If device_deployed -> Site Assessment Completed, Assessment Completed Current
    // ============================================================
    let completedSteps = [];
    
    // Request Received - completed for all statuses
    if (status === 'pending' || status === 'confirmed' || status === 'scheduled' || 
        status === 'in_progress' || status === 'device_deployed' || status === 'data_collecting' ||
        status === 'data_analyzing' || status === 'site_visit_ongoing') {
      completedSteps.push('request_received');
    }
    
    // Approved Booking & Payment Received - completed for confirmed and beyond
    if (status === 'confirmed' || status === 'scheduled' || 
        status === 'in_progress' || status === 'device_deployed' || status === 'data_collecting' ||
        status === 'data_analyzing' || status === 'site_visit_ongoing') {
      completedSteps.push('approved_booking');
      completedSteps.push('payment_received');
    }
    
    // Scheduled Assessment - completed for scheduled and beyond
    if (status === 'scheduled' || status === 'in_progress' || status === 'device_deployed' || 
        status === 'data_collecting' || status === 'data_analyzing' || 
        status === 'site_visit_ongoing') {
      completedSteps.push('scheduled_assessment');
    }
    
    // Site Assessment - completed for in_progress, device_deployed, data_collecting, and beyond
    if (status === 'in_progress' || status === 'device_deployed' || status === 'data_collecting' ||
        status === 'data_analyzing' || status === 'site_visit_ongoing') {
      completedSteps.push('site_assessment');
    }
    
    // Assessment Completed - NOT completed for device_deployed (should be current)
    // Only completed when status is completed
    if (status === 'completed') {
      completedSteps.push('assessment_completed');
    }
    
    const allSteps = [
      { key: 'request_received', title: 'Request Received' },
      { key: 'approved_booking', title: 'Approved Booking' },
      { key: 'payment_received', title: 'Payment Received' },
      { key: 'scheduled_assessment', title: 'Scheduled Assessment' },
      { key: 'site_assessment', title: 'Site Assessment' },
      { key: 'assessment_completed', title: 'Assessment Completed' }
    ];
    
    // Build the timeline with proper statuses
    const result = allSteps.map((step, index) => {
      const isStepCompleted = completedSteps.includes(step.key);
      const isFullyCompleted = status === 'completed';
      
      // If the workflow is fully completed, all steps are completed
      if (isFullyCompleted) {
        return { ...step, status: 'completed' };
      }
      
      // If this step is completed, mark it as completed
      if (isStepCompleted) {
        return { ...step, status: 'completed' };
      }
      
      // Check if this is the first upcoming step (should be current)
      let hasPreviousUncompleted = false;
      for (let i = 0; i < index; i++) {
        const prevStep = allSteps[i];
        if (!completedSteps.includes(prevStep.key)) {
          hasPreviousUncompleted = true;
          break;
        }
      }
      
      // If we haven't found a current step yet and there are no previous uncompleted steps,
      // this is the first upcoming step → it should be current
      if (!hasPreviousUncompleted) {
        return { ...step, status: 'current' };
      }
      
      // Otherwise, it's upcoming
      return { ...step, status: 'upcoming' };
    });
    
    console.log('[TIMELINE] Timeline steps:', result);
    console.log('[TIMELINE] Current step:', result.find(step => step.status === 'current')?.key);
    console.log('[TIMELINE] Completed steps:', result.filter(step => step.status === 'completed').map(s => s.key));
    
    return result;
  };

  const getPreAssessmentProgress = (schedule) => {
    const steps = getPreAssessmentTimeline(schedule);
    const completed = steps.filter(step => step.status === 'completed').length;
    const total = steps.length;
    return Math.round((completed / total) * 100);
  };

  const getInstallationTimeline = (project) => {
    if (!project) return [];

    const isFullPayment = project.paymentPreference === 'full';
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');
    const fullPaid = isPaymentPaid(project, 'full');

    if (isFullPayment) {
      return [
        { key: 'quotation', title: 'Quotation' },
        { key: 'payment', title: 'Full Payment' },
        { key: 'installation', title: 'Installation' },
        { key: 'complete', title: 'Completion' }
      ].map(item => {
        let status = 'upcoming';
        if (item.key === 'quotation') status = 'completed';
        else if (item.key === 'payment') status = fullPaid ? 'completed' : 'upcoming';
        else if (item.key === 'installation') {
          if (project.status === 'completed') status = 'completed';
          else if (['full_paid', 'in_progress'].includes(project.status)) status = 'current';
          else status = 'upcoming';
        } else if (item.key === 'complete') {
          status = project.status === 'completed' ? 'completed' : 'upcoming';
        }
        return { ...item, status };
      });
    } else if (project.paymentPreference === 'fifty_fifty') {
      return [
        { key: 'quotation', title: 'Quotation' },
        { key: 'initial', title: 'Initial Payment — 50%' },
        { key: 'installation', title: 'Installation' },
        { key: 'final', title: 'Final Payment — 50%' },
        { key: 'handover', title: 'Handover' }
      ].map(item => {
        let status = 'upcoming';
        if (item.key === 'quotation') status = 'completed';
        else if (item.key === 'initial') status = (initialPaid || finalPaid) ? 'completed' : 'upcoming';
        else if (item.key === 'installation') {
          if (project.status === 'completed') status = 'completed';
          else if (['in_progress', 'full_paid'].includes(project.status) || finalPaid) status = 'current';
          else if (initialPaid) status = 'upcoming';
          else status = 'upcoming';
        } else if (item.key === 'final') status = finalPaid ? 'completed' : 'upcoming';
        else if (item.key === 'handover') status = project.status === 'completed' ? 'completed' : 'upcoming';
        return { ...item, status };
      });
    } else {
      return [
        { key: 'quotation', title: 'Quotation' },
        { key: 'initial', title: 'Initial Payment — 30%' },
        { key: 'installation', title: 'Installation' },
        { key: 'progress', title: 'Progress Payment — 60%' },
        { key: 'final', title: 'Final Payment — 10%' },
        { key: 'handover', title: 'Handover' }
      ].map(item => {
        let status = 'upcoming';
        if (item.key === 'quotation') status = 'completed';
        else if (item.key === 'initial') status = (initialPaid || finalPaid) ? 'completed' : 'upcoming';
        else if (item.key === 'installation') {
          if (project.status === 'completed') status = 'completed';
          else if (['in_progress', 'progress_paid', 'full_paid'].includes(project.status) || finalPaid) status = 'current';
          else if (initialPaid) status = 'upcoming';
          else status = 'upcoming';
        } else if (item.key === 'progress') status = (progressPaid || finalPaid) ? 'completed' : 'upcoming';
        else if (item.key === 'final') status = finalPaid ? 'completed' : 'upcoming';
        else if (item.key === 'handover') status = project.status === 'completed' ? 'completed' : 'upcoming';
        return { ...item, status };
      });
    }
  };

  const getInstallationProgress = (project) => {
    if (!project) return 0;
    const timeline = getInstallationTimeline(project);
    const completed = timeline.filter(item => item.status === 'completed').length;
    return Math.round((completed / timeline.length) * 100);
  };

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    showToast('Dashboard refreshed', 'success');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchTerm('');
    setCurrentPage(1);
    setAllSchedules([]);
    setSchedules([]);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewDetails = async (schedule) => {
    setSelectedSchedule(schedule);
    
    if (activeTab === 'installation' && schedule._projectData) {
      setSelectedProject(schedule._projectData);
    } else {
      try {
        const token = sessionStorage.getItem('token');
        let projectId = schedule.projectId || schedule.relatedProjectId;
        
        if (projectId) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSelectedProject(response.data.project);
        } else {
          const foundProject = projects.find(p => 
            p.schedules?.some(s => s._id === schedule._id)
          );
          setSelectedProject(foundProject || null);
        }
      } catch (error) {
        console.error('Error fetching project for schedule:', error);
        setSelectedProject(null);
      }
    }
    
    setShowDetailModal(true);
  };

  // ============================================================
  // FORMATTERS
  // ============================================================

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': <span className="status-badge scheduled">Scheduled</span>,
      'confirmed': <span className="status-badge confirmed">Confirmed</span>,
      'in_progress': <span className="status-badge in-progress">In Progress</span>,
      'completed': <span className="status-badge completed">Completed</span>,
      'cancelled': <span className="status-badge cancelled">Cancelled</span>,
      'rescheduled': <span className="status-badge rescheduled">Rescheduled</span>,
      'quoted': <span className="status-badge quoted">Quoted</span>,
      'approved': <span className="status-badge approved">Approved</span>,
      'initial_paid': <span className="status-badge initial-paid">Initial Paid</span>,
      'full_paid': <span className="status-badge full-paid">Full Paid</span>,
      'progress_paid': <span className="status-badge progress-paid">Progress Paid</span>,
      'device_deployed': <span className="status-badge device-deployed">Device Deployed</span>,
      'data_collecting': <span className="status-badge data-collecting">Data Collecting</span>,
      'data_analyzing': <span className="status-badge data-analyzing">Data Analyzing</span>,
      'report_draft': <span className="status-badge report-draft">Report Draft</span>,
      'site_visit_ongoing': <span className="status-badge site-visit-ongoing">Site Visit Ongoing</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      'pre_assessment': <span className="type-badge pre-assessment">Pre-Assessment</span>,
      'site_visit': <span className="type-badge site-visit">Site Visit</span>,
      'installation': <span className="type-badge installation">Installation</span>,
      'inspection': <span className="type-badge inspection">Inspection</span>
    };
    return badges[type] || <span className="type-badge">{type}</span>;
  };

  const getEngineerName = (schedule) => {
    if (schedule?.assignedEngineerId) {
      const eng = schedule.assignedEngineerId;
      if (eng.firstName && eng.lastName) return `${eng.firstName} ${eng.lastName}`;
      if (eng.firstName) return eng.firstName;
      if (eng.lastName) return eng.lastName;
      if (eng.fullName) return eng.fullName;
      if (eng.name) return eng.name;
      if (eng.email) return eng.email.split('@')[0];
    }
    return null;
  };

  const getPaymentTypeLabel = (paymentPreference) => {
    const labels = {
      'full': 'Full Payment',
      'fifty_fifty': '50% - 50% Installment',
      'thirty_sixty_ten': '30% - 60% - 10% Installment'
    };
    return labels[paymentPreference] || 'Installment Plan';
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // ============================================================
  // RENDER
  // ============================================================

  const isLoading = loading && schedules.length === 0;

  const isPreAssessment = selectedSchedule?.type === 'pre_assessment';
  const modalTimelineSteps = isPreAssessment 
    ? getPreAssessmentTimeline(selectedSchedule)
    : getInstallationTimeline(selectedProject);
  const modalProgress = isPreAssessment
    ? getPreAssessmentProgress(selectedSchedule)
    : getInstallationProgress(selectedProject);

  return (
    <>
      <Helmet>
        <title>Schedule Operations Dashboard | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-schedule-dashboard">

        <section className="schedule-overview-section">
        

          {/* 4 SHARED KPI CARDS */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-value">{stats.total}</div>
              <div className="kpi-label">Total Schedules</div>
             
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{stats.upcoming}</div>
              <div className="kpi-label">Upcoming</div>
          
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{stats.confirmed}</div>
              <div className="kpi-label">Confirmed</div>
              
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{stats.completed}</div>
              <div className="kpi-label">Completed</div>
            
            </div>
          </div>

          {/* TABS: ONLY Pre-Assessment & Installation */}
          <div className="tab-container">
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeTab === 'pre_assessment' ? 'active' : ''}`}
                onClick={() => handleTabChange('pre_assessment')}
              >
                Pre-Assessment
              </button>
              <button
                className={`tab-btn ${activeTab === 'installation' ? 'active' : ''}`}
                onClick={() => handleTabChange('installation')}
              >
                Installation
              </button>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="toolbar">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={activeTab === 'pre_assessment' 
                  ? "Search by title, client, project, or ID..." 
                  : "Search by project name, client, engineer, or ID..."}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              <FaSyncAlt className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
          </div>

          {/* SCHEDULE TABLE */}
          <div className="table-container">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>{activeTab === 'pre_assessment' ? 'Title / ID' : 'Project / ID'}</th>
                  <th>Client</th>
                  <th>Engineer</th>
                  <th>Date &amp; Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7" className="loading-cell">Loading schedules...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td colSpan="7" className="empty-cell">
                    {activeTab === 'pre_assessment'
                      ? 'No Pre-Assessment schedules found'
                      : 'No Installation projects found'}
                  </td></tr>
                ) : (
                  schedules.map(schedule => {
                    const engineerName = getEngineerName(schedule);
                    const displayTitle = activeTab === 'installation' 
                      ? schedule.projectName || schedule.title 
                      : schedule.title;

                    // Use enriched status if available
                    const displayStatus = schedule._enrichedStatus || schedule.status;

                    return (
                      <tr key={schedule._id}>
                        <td data-label={activeTab === 'pre_assessment' ? 'Title / ID' : 'Project / ID'}>
                          <div className="title-cell">
                            <div className="schedule-title">{displayTitle || 'Untitled'}</div>
                            <div className="schedule-id">
                              {activeTab === 'installation' 
                                ? schedule.projectReference || schedule._id 
                                : schedule._id}
                            </div>
                          </div>
                        </td>
                        <td data-label="Client">
                          <div className="client-cell">
                            <div className="client-name">{schedule.clientName || 'N/A'}</div>
                            {schedule.clientPhone && (
                              <div className="client-contact">
                                <FaPhone /> {schedule.clientPhone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Engineer">
                          {engineerName || <span className="unassigned">Awaiting assignment</span>}
                        </td>
                        <td data-label="Date & Time">
                          <div className="date-cell">
                            <div className="date-row">{formatDate(schedule.scheduledDate)}</div>
                            <div className="time-row">
                              {formatTime(schedule.scheduledTime)}
                              {schedule.endTime && ` – ${formatTime(schedule.endTime)}`}
                            </div>
                          </div>
                        </td>
                        <td data-label="Type">{getTypeBadge(schedule.type)}</td>
                        <td data-label="Status">{getStatusBadge(displayStatus)}</td>
                        <td data-label="Action" style={{ textAlign: 'center' }}>
                          <button
                            className="view-details-btn"
                            onClick={() => handleViewDetails(schedule)}
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {startItem} to {endItem} of {totalItems} entries
              </div>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft /> Previous
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isPreAssessment ? 'Schedule Details' : 'Installation Project Details'}</h3>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* Schedule Information */}
              <div className="detail-section">
                <h4>{isPreAssessment ? 'Schedule Information' : 'Project Information'}</h4>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label">{isPreAssessment ? 'Title' : 'Project Name'}</span>
                    <span className="detail-value">
                      {isPreAssessment 
                        ? selectedSchedule.title || 'Untitled'
                        : selectedSchedule.projectName || selectedSchedule.title || 'Untitled'}
                    </span>
                  </div>
                  {!isPreAssessment && selectedSchedule.projectReference && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Project Reference</span>
                      <span className="detail-value">{selectedSchedule.projectReference}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{getTypeBadge(selectedSchedule.type)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      {getStatusBadge(selectedSchedule._enrichedStatus || selectedSchedule.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaUser /> Customer</span>
                    <span className="detail-value">{selectedSchedule.clientName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaUserCog /> Engineer</span>
                    <span className="detail-value">{getEngineerName(selectedSchedule) || 'Not assigned'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaCalendarAlt /> Date</span>
                    <span className="detail-value">{formatDate(selectedSchedule.scheduledDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaClock /> Time</span>
                    <span className="detail-value">
                      {formatTime(selectedSchedule.scheduledTime)}
                      {selectedSchedule.endTime && ` – ${formatTime(selectedSchedule.endTime)}`}
                    </span>
                  </div>
                  
                  {/* Show device deployed info if available */}
                  {selectedSchedule._isDeviceDeployed && selectedSchedule._deviceDeployedAt && (
                    <div className="detail-item full-width">
                      <span className="detail-label"><FaMicrochip /> Device Deployment</span>
                      <span className="detail-value" style={{ color: '#059669' }}>
                        <div className="device-deployed-info">
                          <div><strong>Status:</strong> Device Deployed ✅</div>
                          <div><strong>Deployed At:</strong> {formatDateTime(selectedSchedule._deviceDeployedAt)}</div>
                        </div>
                      </span>
                    </div>
                  )}
                  
                  {/* Show report draft info */}
                  {selectedSchedule._isReportDraft && (
                    <div className="detail-item full-width">
                      <span className="detail-label"><FaCheckCircle /> Report Status</span>
                      <span className="detail-value" style={{ color: '#059669' }}>
                        <div className="report-draft-info">
                          <div><strong>Status:</strong> Report Generated ✅</div>
                        </div>
                      </span>
                    </div>
                  )}
                  
                  <div className="detail-item full-width">
                    <span className="detail-label"><FaMapMarkerAlt /> Location</span>
                    <span className="detail-value">
                      {selectedSchedule.address ? (
                        <div className="address-display">
                          {selectedSchedule.address.houseOrBuilding || ''}
                          {selectedSchedule.address.street ? ', ' : ''}
                          {selectedSchedule.address.street || ''}
                          {selectedSchedule.address.barangay ? ', ' : ''}
                          {selectedSchedule.address.barangay || ''}
                          {selectedSchedule.address.cityMunicipality ? ', ' : ''}
                          {selectedSchedule.address.cityMunicipality || ''}
                        </div>
                      ) : selectedProject?.addressId ? (
                        <div className="address-display">
                          {selectedProject.addressId.houseOrBuilding || ''}
                          {selectedProject.addressId.street ? ', ' : ''}
                          {selectedProject.addressId.street || ''}
                          {selectedProject.addressId.barangay ? ', ' : ''}
                          {selectedProject.addressId.cityMunicipality ? ', ' : ''}
                        </div>
                      ) : (
                        'Location TBD'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workflow Timeline - HORIZONTAL */}
              <div className="detail-section timeline-section">
                <h4>
                  {isPreAssessment ? 'Pre-Assessment Workflow' : 'Installation & Project Progress'}
                  {!isPreAssessment && selectedProject && (
                    <span className="payment-plan-badge">
                      {getPaymentTypeLabel(selectedProject.paymentPreference)}
                    </span>
                  )}
                </h4>
                <WorkflowTimeline
                  steps={modalTimelineSteps}
                  progress={modalProgress}
                />
              </div>

              {/* Client Information */}
              <div className="detail-section">
                <h4><FaUser /> Client Information</h4>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedSchedule.clientName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><FaPhone /> Phone</span>
                    <span className="detail-value">{selectedSchedule.clientPhone || 'N/A'}</span>
                  </div>
                  {selectedSchedule.clientEmail && (
                    <div className="detail-item">
                      <span className="detail-label"><FaEnvelope /> Email</span>
                      <span className="detail-value">{selectedSchedule.clientEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Personnel */}
              <div className="detail-section">
                <h4><FaUserCog /> Assigned Personnel</h4>
                {selectedSchedule.assignedEngineerId ? (
                  <div className="detail-grid">
                    <div className="detail-item full-width">
                      <span className="detail-label">Engineer</span>
                      <span className="detail-value">
                        {selectedSchedule.assignedEngineerId.firstName} {selectedSchedule.assignedEngineerId.lastName || ''}
                      </span>
                    </div>
                    {selectedSchedule.assignedEngineerId.email && (
                      <div className="detail-item">
                        <span className="detail-label"><FaEnvelope /> Email</span>
                        <span className="detail-value">{selectedSchedule.assignedEngineerId.email}</span>
                      </div>
                    )}
                    {selectedSchedule.assignedEngineerId.phone && (
                      <div className="detail-item">
                        <span className="detail-label"><FaPhone /> Phone</span>
                        <span className="detail-value">{selectedSchedule.assignedEngineerId.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty-value">Not assigned</p>
                )}
              </div>

              {/* Financial Summary */}
              {!isPreAssessment && selectedProject && (
                <div className="detail-section">
                  <h4><FaMoneyBillWave /> Financial Summary</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Total Cost</span>
                      <span className="detail-value">₱{(selectedProject.totalCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount Paid</span>
                      <span className="detail-value">₱{(selectedProject.amountPaid || 0).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Balance</span>
                      <span className="detail-value">₱{(selectedProject.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payment Plan</span>
                      <span className="detail-value">{getPaymentTypeLabel(selectedProject.paymentPreference)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedSchedule.description && (
                <div className="detail-section">
                  <h4><FaClipboardList /> Description</h4>
                  <p className="detail-description">{selectedSchedule.description}</p>
                </div>
              )}

              {/* Installation Notes */}
              {selectedSchedule.installationNotes && (
                <div className="detail-section">
                  <h4><FaFileAlt /> Installation Notes</h4>
                  <p className="detail-notes">{selectedSchedule.installationNotes}</p>
                </div>
              )}

              {/* Notes */}
              {selectedSchedule.notes && (
                <div className="detail-section">
                  <h4><FaFileAlt /> Notes</h4>
                  <p className="detail-notes">{selectedSchedule.notes}</p>
                </div>
              )}

              {/* Site Photos */}
              {selectedSchedule.sitePhotos && selectedSchedule.sitePhotos.length > 0 && (
                <div className="detail-section">
                  <h4><FaHardHat /> Site Photos ({selectedSchedule.sitePhotos.length})</h4>
                  <div className="site-photos-grid">
                    {selectedSchedule.sitePhotos.map((photo, index) => (
                      <div key={index} className="site-photo-item">
                        <img src={photo} alt={`Site photo ${index + 1}`} />
                        <div className="photo-overlay"><FaHardHat /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};

export default AdminSchedule;