// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StorageHealthRecords {

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    // =====================
    // 1. STRUCT (Struktur Data)
    // =====================

    struct MedicalRecord {
        string cid;
        uint256 timestamp;
        address createdBy; 
    }

    struct HerbalRecord {
        string cid;
        uint256 timestamp;
    }

    struct DoctorProfile {
        string name;
        string specialty;
        bool isApproved;
        bool isRegistered;
    }

    // =====================
    // 2. STORAGE (Penyimpanan State)
    // =====================

    mapping(address => string) public patientNames; // Nama untuk Pasien
    mapping(address => DoctorProfile) public doctors; // Profil lengkap Dokter
    
    mapping(address => mapping(address => bool)) public pendingRequests;
    mapping(address => MedicalRecord[]) private medicalRecords;
    mapping(address => HerbalRecord[]) private herbalRecords;
    mapping(address => mapping(address => bool)) private accessPermission;
    mapping(address => bool) public verifiedDoctor;

    // =====================
    // 3. IDENTITY & REGISTRATION
    // =====================

    // Dokter mendaftar (Status awal: Belum disetujui admin)
    function registerDoctor(string memory _name, string memory _specialty) public {
        require(!doctors[msg.sender].isRegistered, "Sudah terdaftar");
        doctors[msg.sender] = DoctorProfile(_name, _specialty, false, true);
    }

    // Pasien mendaftar nama saja
    function registerPatient(string memory _name) public {
        patientNames[msg.sender] = _name;
    }

    // Admin menyetujui Dokter (Supaya bisa input data herbal/medis)
    function approveDoctor(address _doctor) public onlyAdmin {
        require(doctors[_doctor].isRegistered, "Dokter belum mendaftar");
        doctors[_doctor].isApproved = true;
        verifiedDoctor[_doctor] = true; 
    }

    // =====================
    // 4. MEDICAL ACCESS (REJECT & REVOKE)
    // =====================

    function checkAccess(address _patient, address _doctor) public view returns (bool) {
        return accessPermission[_patient][_doctor];
    }

    function requestAccess(address _patient) public {
        pendingRequests[_patient][msg.sender] = true;
    }

    // Pasien menolak permintaan yang masuk
    function rejectAccess(address _doctor) public {
        require(pendingRequests[msg.sender][_doctor], "No pending request");
        pendingRequests[msg.sender][_doctor] = false;
    }

    // Pasien memberikan izin (Otomatis hapus dari pending)
    function grantAccess(address _doctor) public {
        pendingRequests[msg.sender][_doctor] = false;
        accessPermission[msg.sender][_doctor] = true;
    }

    // Pasien mencabut izin yang sudah ada
    function revokeAccess(address _doctor) public {
        accessPermission[msg.sender][_doctor] = false;
    }

    // =====================
    // 5. DATA MANAGEMENT
    // =====================

    function storeMedicalRecord(address _patient, string memory _cid) public {
        require(
            msg.sender == _patient || accessPermission[_patient][msg.sender] == true, 
            "Access denied"
        );
        medicalRecords[_patient].push(
            MedicalRecord(_cid, block.timestamp, msg.sender)
        );
    }

    function getMedicalRecords(address _patient) public view returns (MedicalRecord[] memory) {
        require(
            msg.sender == _patient || accessPermission[_patient][msg.sender],
            "Access denied"
        );
        return medicalRecords[_patient];
    }

    function storeHerbalData(string memory _cid) public {
        require(verifiedDoctor[msg.sender] && doctors[msg.sender].isApproved, "Doctor not approved");
        herbalRecords[msg.sender].push(HerbalRecord(_cid, block.timestamp));
    }

    function getHerbalRecords(address _doctor) public view returns (HerbalRecord[] memory) {
        return herbalRecords[_doctor];
    }
}