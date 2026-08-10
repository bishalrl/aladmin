# Place SERVICE ACCOUNT JSON here (NOT google-services.json)

# Wrong file (you already have these for mobile apps):
#   src/yantrajson/google-services.json
#   src/budgetingsathijson/google-services.json
#
# Right file looks like:
# {
#   "type": "service_account",
#   "project_id": "...",
#   "private_key": "-----BEGIN PRIVATE KEY-----\n...",
#   "client_email": "firebase-adminsdk-...@....iam.gserviceaccount.com"
# }
#
# Download: Firebase Console → Project settings → Service accounts → Generate new private key
# Save as:
#   secrets/yantramed.json
#   secrets/aarthik-cce43.json
