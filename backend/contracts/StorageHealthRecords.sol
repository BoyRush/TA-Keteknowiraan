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
    // STRUCT
    // =====================

    struct MedicalRecord {
        string cid;
        uint256 timestamp;
    }

    struct HerbalRecord {
        string cid;
        uint256 timestamp;
    }

    // =====================
    // STORAGE
    // =====================

    // pasien => dokter => status_request
    mapping(address => mapping(address => bool)) public pendingRequests;

    // pasien => data medis
    mapping(address => MedicalRecord[]) private medicalRecords;

    // dokter herbal => data herbal
    mapping(address => HerbalRecord[]) private herbalRecords;

    // pasien => dokter => izin
    mapping(address => mapping(address => bool)) private accessPermission;
    function checkAccess(address _patient, address _doctor) public view returns (bool) {
        return accessPermission[_patient][_doctor];
    }

    // admin => dokter terverifikasi
    mapping(address => bool) public verifiedDoctor;

    // =====================
    // MEDICAL (PASIENT)
    // =====================

    function storeMedicalRecord(address _patient, string memory _cid) public {
        // Validasi: Pengirim (msg.sender) harus si pasien itu sendiri 
        // ATAU dokter yang sudah diberi izin (accessPermission)
        require(
            msg.sender == _patient || accessPermission[_patient][msg.sender] == true, 
            "Access denied: No permission to store record"
        );

        medicalRecords[_patient].push(
            MedicalRecord(_cid, block.timestamp)
        );
    }

    function rejectAccess(address _doctor) public {
        // Pastikan memang ada request sebelumnya
        require(pendingRequests[msg.sender][_doctor], "No pending request from this doctor");
        
        // Hapus dari daftar pending
        pendingRequests[msg.sender][_doctor] = false;
        
        // Pastikan permission tetap false (sebagai pengaman tambahan)
        accessPermission[msg.sender][_doctor] = false;
    }

    function requestAccess(address _patient) public {
        pendingRequests[_patient][msg.sender] = true;
    }

    function grantAccess(address _doctor) public {
        accessPermission[msg.sender][_doctor] = true;
    }

    function revokeAccess(address _doctor) public {
        accessPermission[msg.sender][_doctor] = false;
    }

    function getMedicalRecords(address _patient)
        public
        view
        returns (MedicalRecord[] memory)
    {
        require(
            msg.sender == _patient || accessPermission[_patient][msg.sender],
            "Access denied"
        );
        return medicalRecords[_patient];
    }

    // =====================
    // HERBAL (DOKTER HERBAL)
    // =====================

    function storeHerbalData(string memory _cid) public {
        require(
            verifiedDoctor[msg.sender],
            "Doctor not verified"
        );

        herbalRecords[msg.sender].push(
            HerbalRecord(_cid, block.timestamp)
        );
    }

    function getHerbalRecords(address _doctor)
        public
        view
        returns (HerbalRecord[] memory)
    {
        return herbalRecords[_doctor];
    }

    // =====================
    // ADMIN
    // =====================

    function verifyDoctor(address _doctor) public onlyAdmin {
        verifiedDoctor[_doctor] = true;
    }
}
