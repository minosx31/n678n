export const sampleProcessByLabel: Record<string, any> = {
  "Firewall change": {
    "process_id": "PROC-1769524665883",
    "created_at": "2026-01-27T14:37:45.883Z",
    "name": "Vendor Onboarding",
    "description": "Process for onboarding new vendors, including policy checks and risk assessment.",
    "version": "v1.0",
    "formDefinition": {
        "title": "New Vendor Onboarding Form",
        "description": "Please provide the details for the new vendor.",
        "fields": [
            {
                "fieldId": "vendorName",
                "key": "vendorName",
                "label": "Vendor Name",
                "type": "text",
                "required": true,
                "placeholder": "Enter the vendor's name"
            },
            {
                "fieldId": "contractValue",
                "key": "contractValue",
                "label": "Contract Value",
                "type": "number",
                "required": true,
                "placeholder": "Enter the contract value",
                "validation": {
                    "min": 0
                }
            },
            {
                "fieldId": "dataAccessLevel",
                "key": "dataAccessLevel",
                "label": "Data Access Level",
                "type": "select",
                "required": true,
                "placeholder": "Select data access level",
                "options": [
                    {
                        "value": "low",
                        "label": "Low"
                    },
                    {
                        "value": "medium",
                        "label": "Medium"
                    },
                    {
                        "value": "high",
                        "label": "High"
                    },
                    {
                        "value": "full",
                        "label": "Full"
                    }
                ]
            },
            {
                "fieldId": "complianceDocuments",
                "key": "complianceDocuments",
                "label": "Compliance Documents",
                "type": "file",
                "required": true,
                "placeholder": "Upload compliance documents"
            }
        ]
    },
    "policies": [
        {
            "policy_id": "policy_data_access_level",
            "policy_text": "Vendors with 'full' data access require explicit approval from the CISO.",
            "type": "business-rule",
            "severity": "high"
        },
        {
            "policy_id": "policy_contract_value_limit",
            "policy_text": "Contracts exceeding $1,000,000 require dual executive approval.",
            "type": "business-rule",
            "severity": "medium"
        }
    ],
    "riskDefinitions": [
        {
            "riskId": "risk_data_access_security",
            "riskDefinition": "Risk score is calculated based on the data access level. 'Full' access contributes highest risk, 'low' access contributes lowest.",
            "thresholds": {
                "low": 0.2,
                "medium": 0.5,
                "high": 0.8
            },
            "description": "Measures the security risk associated with the vendor's access to enterprise data."
        },
        {
            "riskId": "risk_contract_financial",
            "riskDefinition": "Risk score is a function of contract value relative to predefined tiers.",
            "thresholds": {
                "low": 500000,
                "medium": 1000000,
                "high": 2000000
            },
            "description": "Measures the financial exposure and commitment associated with the vendor contract."
        }
    ],
    "agentConfig": {
        "allowHumanOverride": true,
        "defaultDecision": "H",
        "confidenceThreshold": 0.85
    }
  },
  "Software purchase": {
    "process_id": "PROC-1769523502600",
    "created_at": "2026-01-27T14:18:22.600Z",
    "name": "Software Purchase Request",
    "description": "Process for requesting and approving software purchases.",
    "version": "v1.0",
    "formDefinition": {
        "title": "Software Purchase Request Form",
        "description": "Please provide details for your software purchase request.",
        "fields": [
            {
                "fieldId": "softwareName",
                "key": "softwareName",
                "label": "Software Name",
                "type": "text",
                "required": true,
                "placeholder": "e.g., Microsoft Office Suite"
            },
            {
                "fieldId": "vendor",
                "key": "vendor",
                "label": "Vendor",
                "type": "text",
                "required": true,
                "placeholder": "e.g., Microsoft"
            },
            {
                "fieldId": "cost",
                "key": "cost",
                "label": "Cost",
                "type": "number",
                "required": true,
                "placeholder": "e.g., 450.50",
                "validation": {
                    "min": 0
                }
            },
            {
                "fieldId": "licenseType",
                "key": "licenseType",
                "label": "License Type",
                "type": "select",
                "required": true,
                "placeholder": "Select license type",
                "options": [
                    {
                        "value": "perpetual",
                        "label": "Perpetual"
                    },
                    {
                        "value": "subscription",
                        "label": "Subscription"
                    },
                    {
                        "value": "user-based",
                        "label": "User-Based"
                    },
                    {
                        "value": "device-based",
                        "label": "Device-Based"
                    }
                ]
            },
            {
                "fieldId": "justification",
                "key": "justification",
                "label": "Justification",
                "type": "text",
                "required": true,
                "placeholder": "Explain why this software is needed."
            }
        ]
    },
    "policies": [
        {
            "policy_id": "budget_availability_check",
            "policy_text": "Budget for software purchases must be available.",
            "type": "business-rule",
            "severity": "high"
        },
        {
            "policy_id": "license_inventory_check",
            "policy_text": "Existing license inventory should be checked before purchase.",
            "type": "business-rule",
            "severity": "medium"
        }
    ],
    "riskDefinitions": [
        {
            "riskId": "cost_risk",
            "riskDefinition": "Risk score increases with higher software cost.",
            "thresholds": {
                "low": 250,
                "medium": 1000,
                "high": 5000
            },
            "description": "Measures the financial risk associated with the software cost."
        },
        {
            "riskId": "vendor_risk",
            "riskDefinition": "Risk score increases if the vendor is not pre-approved or has a poor reputation.",
            "thresholds": {
                "low": 0.2,
                "medium": 0.5,
                "high": 0.8
            },
            "description": "Measures the risk associated with the chosen vendor."
        }
    ],
    "agentConfig": {
        "allowHumanOverride": true,
        "defaultDecision": "H",
        "confidenceThreshold": 0.9
    }
  },
  "Access to production": {
    "process_id": "PROC-1769524580145",
    "created_at": "2026-01-27T14:36:20.145Z",
    "name": "Temporary Production Access",
    "description": "Approval process for granting temporary access to production systems.",
    "version": "v1.0",
    "formDefinition": {
        "title": "Temporary Production Access Request",
        "description": "Request for temporary access to production systems.",
        "fields": [
            {
                "fieldId": "user",
                "key": "user",
                "label": "User",
                "type": "text",
                "required": true,
                "placeholder": "Enter username..."
            },
            {
                "fieldId": "system",
                "key": "system",
                "label": "System",
                "type": "text",
                "required": true,
                "placeholder": "Enter production system name..."
            },
            {
                "fieldId": "duration",
                "key": "duration",
                "label": "Duration (hours)",
                "type": "number",
                "required": true,
                "placeholder": "e.g., 4, 24, 48",
                "validation": {
                    "min": 1
                }
            },
            {
                "fieldId": "justification",
                "key": "justification",
                "label": "Justification",
                "type": "text",
                "required": true,
                "placeholder": "Explain why access is needed...",
                "validation": {
                    "maxLength": 500
                }
            },
            {
                "fieldId": "accessType",
                "key": "accessType",
                "label": "Access Type",
                "type": "select",
                "required": true,
                "placeholder": "Select access type...",
                "options": [
                    {
                        "value": "read_only",
                        "label": "Read-Only"
                    },
                    {
                        "value": "admin",
                        "label": "Admin"
                    }
                ]
            }
        ]
    },
    "policies": [
        {
            "policy_id": "manager_approval_policy",
            "policy_text": "If duration > 24 hours, manager approval is required.",
            "type": "business-rule",
            "severity": "high"
        },
        {
            "policy_id": "security_approval_policy",
            "policy_text": "If access type is 'admin', security approval is required.",
            "type": "business-rule",
            "severity": "high"
        },
        {
            "policy_id": "auto_approve_low_risk_read_only",
            "policy_text": "Auto-approve requests for read-only access if risk is low.",
            "type": "business-rule",
            "severity": "low"
        }
    ],
    "riskDefinitions": [
        {
            "riskId": "access_risk",
            "riskDefinition": "Risk score is calculated based on duration and access type. Admin access and longer durations increase risk.",
            "thresholds": {
                "low": 0.3,
                "medium": 0.6,
                "high": 1
            },
            "description": "Measures the potential impact of unauthorized or misused access."
        }
    ],
    "agentConfig": {
        "allowHumanOverride": true,
        "defaultDecision": "H",
        "confidenceThreshold": 0.95
    }
  },
  "Vendor onboarding": {
    "process_id": "PROC-1769524665883",
    "created_at": "2026-01-27T14:37:45.883Z",
    "name": "Vendor Onboarding",
    "description": "Process for onboarding new vendors, including policy checks and risk assessment.",
    "version": "v1.0",
    "formDefinition": {
        "title": "New Vendor Onboarding Form",
        "description": "Please provide the details for the new vendor.",
        "fields": [
            {
                "fieldId": "vendorName",
                "key": "vendorName",
                "label": "Vendor Name",
                "type": "text",
                "required": true,
                "placeholder": "Enter the vendor's name"
            },
            {
                "fieldId": "contractValue",
                "key": "contractValue",
                "label": "Contract Value",
                "type": "number",
                "required": true,
                "placeholder": "Enter the contract value",
                "validation": {
                    "min": 0
                }
            },
            {
                "fieldId": "dataAccessLevel",
                "key": "dataAccessLevel",
                "label": "Data Access Level",
                "type": "select",
                "required": true,
                "placeholder": "Select data access level",
                "options": [
                    {
                        "value": "low",
                        "label": "Low"
                    },
                    {
                        "value": "medium",
                        "label": "Medium"
                    },
                    {
                        "value": "high",
                        "label": "High"
                    },
                    {
                        "value": "full",
                        "label": "Full"
                    }
                ]
            },
            {
                "fieldId": "complianceDocuments",
                "key": "complianceDocuments",
                "label": "Compliance Documents",
                "type": "file",
                "required": true,
                "placeholder": "Upload compliance documents"
            }
        ]
    },
    "policies": [
        {
            "policy_id": "policy_data_access_level",
            "policy_text": "Vendors with 'full' data access require explicit approval from the CISO.",
            "type": "business-rule",
            "severity": "high"
        },
        {
            "policy_id": "policy_contract_value_limit",
            "policy_text": "Contracts exceeding $1,000,000 require dual executive approval.",
            "type": "business-rule",
            "severity": "medium"
        }
    ],
    "riskDefinitions": [
        {
            "riskId": "risk_data_access_security",
            "riskDefinition": "Risk score is calculated based on the data access level. 'Full' access contributes highest risk, 'low' access contributes lowest.",
            "thresholds": {
                "low": 0.2,
                "medium": 0.5,
                "high": 0.8
            },
            "description": "Measures the security risk associated with the vendor's access to enterprise data."
        },
        {
            "riskId": "risk_contract_financial",
            "riskDefinition": "Risk score is a function of contract value relative to predefined tiers.",
            "thresholds": {
                "low": 500000,
                "medium": 1000000,
                "high": 2000000
            },
            "description": "Measures the financial exposure and commitment associated with the vendor contract."
        }
    ],
    "agentConfig": {
        "allowHumanOverride": true,
        "defaultDecision": "H",
        "confidenceThreshold": 0.85
    }
  },
}
