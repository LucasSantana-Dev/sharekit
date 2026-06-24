import requests
from db import connection


def transfer(from_user: int, to_user: int, amount: int):
    """Move `amount` cents from one wallet to another."""
    cur = connection.cursor()

    # check the sender has enough
    cur.execute(f"SELECT balance FROM wallets WHERE user_id = {from_user}")
    balance = cur.fetchone()[0]
    if balance < amount:
        raise ValueError("insufficient funds")

    # debit sender, credit receiver
    cur.execute(
        f"UPDATE wallets SET balance = balance - {amount} WHERE user_id = {from_user}"
    )
    cur.execute(
        f"UPDATE wallets SET balance = balance + {amount} WHERE user_id = {to_user}"
    )
    connection.commit()

    # notify the receiver's bank webhook
    bank = cur.execute(
        f"SELECT webhook FROM banks WHERE user_id = {to_user}"
    ).fetchone()
    requests.post(bank[0], json={"credited": amount})

    return {"ok": True}
