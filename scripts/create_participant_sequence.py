#!/usr/bin/env python3
"""
Create a Kit (ConvertKit) email sequence for the LG Participant Journey.

Usage:
    python scripts/create_participant_sequence.py

Prerequisites:
    - Set KIT_API_SECRET env var (or edit the constant below)

IMPORTANT:
    The Kit API can create sequences but CANNOT set email body content.
    After running this script, Wayne must log in to the Kit dashboard and
    manually add the email copy for each step in the sequence:

    Step 1 (Session 7):  Mid-program pulse link
    Step 2 (Session 13): Post-program form link
    Step 3 (90 days):    Follow-up form link (only to consenting participants)

    After creating the sequence, update PARTICIPANT_KIT_SEQUENCE_ID in:
        app/api/outcomes/register/route.ts
"""

import os
import json
import urllib.request

KIT_API_SECRET = os.environ.get('KIT_API_SECRET', '')

if not KIT_API_SECRET:
    print('ERROR: Set the KIT_API_SECRET environment variable first.')
    print('  export KIT_API_SECRET="vMJHo4wv2zp8sgK0VJP-h4Wtbr6bzBwvTRveiUPJJqE"')
    exit(1)

# Create the sequence
payload = json.dumps({
    'api_secret': KIT_API_SECRET,
    'name': 'LG Participant Journey',
}).encode()

req = urllib.request.Request(
    'https://api.convertkit.com/v3/sequences',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST',
)

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        seq = data.get('sequence', data)
        seq_id = seq.get('id', 'UNKNOWN')
        print(f'Sequence created successfully!')
        print(f'  Name: LG Participant Journey')
        print(f'  Sequence ID: {seq_id}')
        print()
        print(f'Next steps:')
        print(f'  1. Update PARTICIPANT_KIT_SEQUENCE_ID in app/api/outcomes/register/route.ts')
        print(f'     Replace PLACEHOLDER_REPLACE_WITH_REAL_ID with: {seq_id}')
        print(f'  2. Open Kit dashboard and add email content to each sequence step')
        print(f'     (Kit API cannot write email bodies — this must be done manually)')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f'ERROR {e.code}: {body}')
    exit(1)
