# Firebase Firestore setup

このアプリはFirebase設定が入っている場合、Firestoreに案件を保存します。未設定の場合は従来通りブラウザのlocalStorageに保存します。

## 1. Firebaseプロジェクトを作成

1. Firebase Consoleでプロジェクトを作成します。
2. Webアプリを追加します。
3. 表示されたFirebase configの値を `.env.local` に設定します。

## 2. Authenticationを有効化

Firebase Consoleの Authentication > ログイン方法 で、次のプロバイダを有効化します。

- 匿名
- Google
- メール/パスワード

匿名は未ログイン時の一時保存に使います。Googleまたはメールでログインすると、同じアカウントで複数デバイスから同じ案件一覧を開けます。

## 3. Firestore Databaseを作成

Firestore Databaseを作成し、ルールを次の内容にします。

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/estimate_projects/{projectId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

## 4. 環境変数を設定

`.env.local` にFirebase configを追加します。

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

変更後は開発サーバーを再起動してください。

## 保存の流れ

1. 案件を作成します。
2. 「下書き保存」または見積完了時の保存処理を実行します。
3. アプリはlocalStorageへ即時保存します。
4. ログイン済みの場合は `users/{uid}/estimate_projects` に保存します。
5. 起動時にFirestoreとlocalStorageの案件を結合し、更新日時が新しいものを優先します。
