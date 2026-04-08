import json
import uuid

# The original JSON provided by the user
original_json_str = """
{
  "name": "AI-ANALYSE",
  "nodes": [
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-tesseractjs.tesseractNode",
      "typeVersion": 1,
      "position": [
        -1664,
        -80
      ],
      "id": "d4666e48-3f5c-497b-8e89-23f08205d4ba",
      "name": "Tesseract"
    },
    {
      "parameters": {
        "text": "={{ $json.markdown }}",
        "attributes": {
          "attributes": [
            {
              "name": "name",
              "description": "Full name of the candidate",
              "required": true
            },
            {
              "name": "email",
              "description": "Candidate’s email address",
              "required": true
            },
            {
              "name": "phone",
              "description": "Candidate’s phone number",
              "required": true
            },
             {
              "name": "dob",
              "description": "Date of Birth or Age",
              "required": false
            },
             {
              "name": "address",
              "description": "Address or Location",
              "required": false
            }
          ]
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.informationExtractor",
      "typeVersion": 1.1,
      "position": [
        -656,
        -100
      ],
      "id": "agent_personal_info",
      "name": "Agent: Personal Info",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "text": "={{ $json.markdown }}",
        "attributes": {
          "attributes": [
             {
              "name": "experiences",
              "description": "List of work experiences (Company, Role, Dates, Description)",
              "required": true
            },
            {
              "name": "total_years_experience",
              "description": "Total years of relevant experience",
              "required": false
            }
          ]
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.informationExtractor",
      "typeVersion": 1.1,
      "position": [
        -656,
        100
      ],
      "id": "agent_experience",
      "name": "Agent: Experience",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "text": "={{ $json.markdown }}",
        "attributes": {
          "attributes": [
             {
              "name": "projects",
              "description": "List of projects (Name, Role, Tech Stack, Description)",
              "required": false
            }
          ]
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.informationExtractor",
      "typeVersion": 1.1,
      "position": [
        -656,
        300
      ],
      "id": "agent_projects",
      "name": "Agent: Projects",
      "onError": "continueRegularOutput"
    },
     {
      "parameters": {
        "text": "={{ $json.markdown }}",
        "attributes": {
          "attributes": [
             {
              "name": "education",
              "description": "Education history (Degrees, Schools, Dates)",
              "required": true
            },
             {
              "name": "certifications",
              "description": "Certifications and Licenses",
              "required": false
            }
          ]
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.informationExtractor",
      "typeVersion": 1.1,
      "position": [
        -656,
        500
      ],
      "id": "agent_education",
      "name": "Agent: Education",
      "onError": "continueRegularOutput"
    },
     {
      "parameters": {
        "text": "={{ $json.markdown }}",
        "attributes": {
          "attributes": [
             {
              "name": "skills",
              "description": "List of technical and soft skills",
              "required": true
            },
             {
              "name": "languages",
              "description": "Languages spoken and proficiency",
              "required": false
            }
          ]
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.informationExtractor",
      "typeVersion": 1.1,
      "position": [
        -656,
        700
      ],
      "id": "agent_skills",
      "name": "Agent: Skills",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.cloud.llamaindex.ai/api/v1/parsing/upload",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            },
            {
              "name": "Authorization",
              "value": "Bearer llx-HN9SaPSk0awzIwRfOlkQYlL2BU6XA6gFZXx0P1aI899MAodq"
            }
          ]
        },
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "parameterType": "formBinaryData",
              "name": "file",
              "inputDataFieldName": "data"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -1664,
        224
      ],
      "id": "34e047ad-cf10-44ca-85b5-f308fb7aaf64",
      "name": "Upload"
    },
    {
      "parameters": {
        "url": "=https://api.cloud.llamaindex.ai/api/v1/parsing/job/{{ $json.id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            },
            {
              "name": "Authorization",
              "value": "Bearer llx-HN9SaPSk0awzIwRfOlkQYlL2BU6XA6gFZXx0P1aI899MAodq"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -1360,
        224
      ],
      "id": "074758a1-44d0-43b5-88e1-eb544b880efd",
      "name": "Status"
    },
    {
      "parameters": {
        "url": "=https://api.cloud.llamaindex.ai/api/v1/parsing/job/{{ $json.id }}/result/markdown",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            },
            {
              "name": "Authorization",
              "value": "Bearer llx-HN9SaPSk0awzIwRfOlkQYlL2BU6XA6gFZXx0P1aI899MAodq"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -1040,
        208
      ],
      "id": "a30d4077-deb2-4444-9cbe-709e3095ec19",
      "name": "Get"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $('Up CV to Drive1').item.json.fileExtension }}",
                    "rightValue": "png",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "36584cf8-8764-4e7a-bb1a-0877c2a78014"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "PNG"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "30167564-7a8e-40a1-9009-64be1031fded",
                    "leftValue": "={{ $('Up CV to Drive1').item.json.fileExtension }}",
                    "rightValue": "pdf",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "PDF"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        -1856,
        64
      ],
      "id": "d4f62581-9d4d-47c2-abea-560a622764a1",
      "name": "Switch2"
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        -1488,
        224
      ],
      "id": "5d09fc3f-4ffc-4245-ae67-bf660bf5c936",
      "name": "Wait1",
      "webhookId": "YOUR_WEBHOOK_ID"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.status }}",
                    "rightValue": "SUCCESS",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "5fe5fdf8-6137-4466-8e88-acaaebbf94a5"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "SUCCESS"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "a1480222-bc5d-4697-b169-5e94a5afa0ed",
                    "leftValue": "={{ $json.status }}",
                    "rightValue": "PENDING",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "PENDING"
            }
          ]
        },
        "looseTypeValidation": true,
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        -1216,
        224
      ],
      "id": "07977236-4f9a-4d3d-b708-4dedada15b31",
      "name": "Switch3"
    },
    {
      "parameters": {
        "sendTo": "={{ $('Webhook2').item.json.body.email }}",
        "subject": "Congraturation",
        "message": "=<!DOCTYPE html><html>...</html>",
        "options": {}
      },
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2.1,
      "position": [
        1520,
        144
      ],
      "id": "296dde79-cbe6-4a20-b921-4e1a073716b9",
      "name": "Send a message",
      "webhookId": "c3c3bece-51bc-4c43-b200-847122e336f3",
      "credentials": {
        "gmailOAuth2": {
          "id": "kjQP2WLhJvVff4Y4",
          "name": "Gmail account"
        }
      }
    },
    {
      "parameters": {
        "resource": "image",
        "operation": "analyze",
        "modelId": {
          "__rl": true,
          "value": "models/gemini-2.5-flash",
          "mode": "list",
          "cachedResultName": "models/gemini-2.5-flash"
        },
        "text": "Act as a recruitment and CV design expert...",
        "inputType": "binary",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.googleGemini",
      "typeVersion": 1,
      "position": [
        -1664,
        448
      ],
      "id": "4e4fb4b6-4869-4fcc-93f6-5dc45d127f0a",
      "name": "Analyze image",
      "credentials": {
        "googlePalmApi": {
          "id": "w8s5hWBitN2nuYtw",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        -320,
        144
      ],
      "id": "569f3ac5-7fb2-4181-8a5c-fb372d76268d",
      "name": "Merge2"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=You are a recruitment expert...",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.1,
      "position": [
        -128,
        144
      ],
      "id": "c40895ff-9011-44fe-9fe1-b87e1c0e82b2",
      "name": "AI Agent1"
    },
    {
      "parameters": {
        "jsCode": "const items = $input.all();\\n\\n// Build Markdown from parsed text block\\nconst markdownItems = items.map(item => {\\n  const text = item.json.text || '';\\n  return {\\n    json: {\\n      markdown: `### Parsed CV\\\\n\\\\n\\\\`\\\\`\\\\`\\\\n${text.trim()}\\\\n\\\\`\\\\`\\\\`\\n    }\\n  };\\n});\\n\\nreturn markdownItems;\\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1040,
        -80
      ],
      "id": "8ad3e818-9282-4348-80c8-093a199b22ce",
      "name": "Code4"
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [
        -448,
        128
      ],
      "id": "merge_agents_node",
      "name": "Merge Agents Results"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        -160,
        352
      ],
      "id": "7629c602-9bac-4bea-a3bb-2ca62dc83ea0",
      "name": "Google Gemini Chat Model5",
      "credentials": {
        "googlePalmApi": {
          "id": "w8s5hWBitN2nuYtw",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
       "parameters": {
        "jsCode": "const items = $input.all(); \n return items;"
       },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        192,
        144
      ],
      "id": "6dc5d959-f0ec-403c-ae3e-92aac5ff4a47",
      "name": "Code5"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "post-resume-candidate",
        "options": {
          "allowedOrigins": "*http://localhost:5173"
        }
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -2368,
        64
      ],
      "id": "ce38a9a8-3319-417e-9b9c-d264a94e528e",
      "name": "Webhook2",
      "webhookId": "95ead960-b5e4-4a2b-8c02-dc4b92d180a4"
    },
    {
      "parameters": {
        "inputDataFieldName": "file",
        "name": "=CV-Candidate-{{ $json.body.phoneNumber }}.pdf",
        "driveId": {
          "__rl": true,
          "mode": "list",
          "value": "My Drive"
        },
        "folderId": {
          "__rl": true,
          "value": "=1YORUOSOyf1F4rgmu7Y3KSY5GCGBoBRtW",
          "mode": "id"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleDrive",
      "typeVersion": 3,
      "position": [
        -2192,
        64
      ],
      "id": "ff6777c1-2e3c-409d-86c0-7c061a5436be",
      "name": "Up CV to Drive1",
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "ge64lxj1VWOALot3",
          "name": "Google Drive account"
        }
      }
    },
    {
      "parameters": {
        "operation": "download",
        "fileId": {
          "__rl": true,
          "value": "={{ $json.id }}",
          "mode": "id"
        },
        "options": {}
      },
      "id": "58170c11-70b4-42bd-a63a-880762b7839b",
      "name": "Get pdf file",
      "type": "n8n-nodes-base.googleDrive",
      "position": [
        -2016,
        64
      ],
      "typeVersion": 3,
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "ge64lxj1VWOALot3",
          "name": "Google Drive account"
        }
      }
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        -672,
        336
      ],
      "id": "19ae3042-b2ee-4f71-a247-b1351d45db58",
      "name": "Google Gemini Chat Model",
      "credentials": {
        "googlePalmApi": {
          "id": "w8s5hWBitN2nuYtw",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "97be5134-ecc3-4f5e-adb6-411abd2be81d",
              "name": "output",
              "value": "={{ $json.output }}",
              "type": "object"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        -16,
        -64
      ],
      "id": "f6cda219-125a-4393-b2e9-01d5abe2db9e",
      "name": "Edit Fields1"
    },
    {
      "parameters": {
        "jsCode": "const input = $input.first().json; \n const webhookData = $('Webhook2').first().json.body;\n const pdfData = $('Get pdf file').first().json;\n return { ...input, job_posting_id: webhookData.job_posting_id, resume_file: pdfData.webViewLink };"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        608,
        144
      ],
      "id": "9c7e4c77-9ef0-40f0-9f6f-f93ea456b71f",
      "name": "Code"
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineByPosition",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        400,
        144
      ],
      "id": "add14f9b-1ee0-4109-a3c6-73a381e117b7",
      "name": "Merge"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1008,
        128
      ],
      "id": "4a97748e-dfe7-4f7d-9bb9-3baababa20a7",
      "name": "Insert rows in a table",
      "credentials": {
        "postgres": {
          "id": "Z9dniQHovA32biU0",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
         "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1008,
        304
      ],
      "id": "bc903267-cd5a-4b04-a187-b0011107bdfa",
      "name": "Insert rows in a table1",
      "credentials": {
        "postgres": {
          "id": "Z9dniQHovA32biU0",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "fieldToSplitOut": "suggestion_skills",
        "options": {}
      },
      "type": "n8n-nodes-base.splitOut",
      "typeVersion": 1,
      "position": [
        816,
        304
      ],
      "id": "694c78b5-8f87-4ddb-9470-92fb1a6b1103",
      "name": "Split Out"
    },
    {
      "parameters": {
        "mode": "combine",
        "options": {}
      },
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        1328,
        144
      ],
      "id": "eb67eaaa-b539-49f8-b399-cc81e777f011",
      "name": "Merge1"
    }
  ],
  "pinData": {},
  "connections": {
    "Code4": {
      "main": [
        [
          {
            "node": "Agent: Personal Info",
            "type": "main",
            "index": 0
          },
          {
            "node": "Agent: Experience",
            "type": "main",
            "index": 0
          },
          {
            "node": "Agent: Projects",
            "type": "main",
            "index": 0
          },
          {
            "node": "Agent: Education",
            "type": "main",
            "index": 0
          },
          {
            "node": "Agent: Skills",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "Agent: Personal Info",
            "type": "ai_languageModel",
            "index": 0
          },
           {
            "node": "Agent: Experience",
            "type": "ai_languageModel",
            "index": 0
          },
           {
            "node": "Agent: Projects",
            "type": "ai_languageModel",
            "index": 0
          },
           {
            "node": "Agent: Education",
            "type": "ai_languageModel",
            "index": 0
          },
           {
            "node": "Agent: Skills",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Agent: Personal Info": {
      "main": [
        [
          {
            "node": "Merge Agents Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Agent: Experience": {
      "main": [
        [
          {
            "node": "Merge Agents Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Agent: Projects": {
      "main": [
        [
          {
            "node": "Merge Agents Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Agent: Education": {
      "main": [
        [
          {
            "node": "Merge Agents Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Agent: Skills": {
      "main": [
        [
          {
            "node": "Merge Agents Results",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Agents Results": {
       "main": [
         [
           {
             "node": "Merge2",
             "type": "main",
             "index": 0
           }
         ]
       ]
    },
    "Upload": {
      "main": [
        [
          {
            "node": "Wait1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Status": {
      "main": [
        [
          {
            "node": "Switch3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get": {
      "main": [
        [
          {
            "node": "Code4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch2": {
      "main": [
        [
          {
            "node": "Analyze image",
            "type": "main",
            "index": 0
          },
          {
            "node": "Tesseract",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Upload",
            "type": "main",
            "index": 0
          },
          {
            "node": "Analyze image",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait1": {
      "main": [
        [
          {
            "node": "Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch3": {
      "main": [
        [
          {
            "node": "Get",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Wait1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Analyze image": {
      "main": [
        [
          {
            "node": "Merge2",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Merge2": {
      "main": [
        [
          {
            "node": "AI Agent1",
            "type": "main",
            "index": 0
          },
          {
            "node": "Edit Fields1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent1": {
      "main": [
        [
          {
            "node": "Code5",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model5": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent1",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Code5": {
      "main": [
        [
          {
            "node": "Merge",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Webhook2": {
      "main": [
        [
          {
            "node": "Up CV to Drive1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Up CV to Drive1": {
      "main": [
        [
          {
            "node": "Get pdf file",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get pdf file": {
      "main": [
        [
          {
            "node": "Switch2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields1": {
      "main": [
        [
          {
            "node": "Merge",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code": {
      "main": [
        [
          {
            "node": "Split Out",
            "type": "main",
            "index": 0
          },
          {
            "node": "Insert rows in a table",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge": {
      "main": [
        [
          {
            "node": "Code",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tesseract": {
      "main": [
        [
          {
            "node": "Code4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Insert rows in a table": {
      "main": [
        [
          {
            "node": "Merge1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Insert rows in a table1": {
      "main": [
        [
          {
            "node": "Merge1",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Split Out": {
      "main": [
        [
          {
            "node": "Insert rows in a table1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send a message": {
      "main": [
        []
      ]
    },
    "Merge1": {
      "main": [
        [
          {
            "node": "Send a message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1"
  }
}
"""

with open("n8n_multitask_cv_agents.json", "w", encoding="utf-8") as f:
    f.write(original_json_str)
