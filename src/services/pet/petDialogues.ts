import type {
  PetId,
  PetState,
  PetDialogueItem,
  MascotPersonaMetadata,
  DialogueSelectionOptions,
} from '@/types/pet';
import i18n from '@/services/i18n';
import { PET_DIALOGUES_EN } from './petDialoguesEn';

export const MASCOT_METADATA: Record<PetId, MascotPersonaMetadata> = {
  'cipher-cat': {
    id: 'cipher-cat',
    name: 'Cipher Cat',
    vietnameseName: 'Mèo Mật Mã',
    title: 'Chuyên gia Mật mã học',
    description: 'Tinh nghịch, nhanh nhẹn, luôn cảnh giác bảo vệ khoá bảo mật.',
    catchphrase: 'Bảo mật chuẩn xác như một cú vồ của mèo!',
    signatureEmoji: '🐱',
  },
  'byte-dog': {
    id: 'byte-dog',
    name: 'Byte Dog',
    vietnameseName: 'Chó Byte',
    title: 'Vệ sĩ Canh gác 24/7',
    description: 'Trung thành, đáng tin cậy, chuyên gia canh gác cổng 2FA.',
    catchphrase: 'Gâu gâu! Em canh gác kho mã 24/7 cho sếp!',
    signatureEmoji: '🐶',
  },
  'shield-bunny': {
    id: 'shield-bunny',
    name: 'Shield Bunny',
    vietnameseName: 'Thỏ Khiên',
    title: 'Hộ vệ Khiên Mã hóa',
    description: 'Thông minh, cẩn thận, chuyên gia về mã hoá và sao lưu.',
    catchphrase: 'Chiếc khiên số luôn che chắn an toàn cho bạn!',
    signatureEmoji: '🐰',
  },
};

export const PET_DIALOGUES: Record<PetId, Record<PetState | 'TIPS', PetDialogueItem[]>> = {
  'cipher-cat': {
    IDLE: [
      { id: 'cat_idle_1', text: 'Mã OTP đã được mã hóa an toàn trong Keychain phần cứng.' },
      { id: 'cat_idle_2', text: 'Tớ đang quan sát từng mili-giây, mọi thứ đều trong tầm kiểm soát.' },
      { id: 'cat_idle_3', text: 'Bí mật chung của bạn được bảo vệ tuyệt đối bằng SHA-256.' },
      { id: 'cat_idle_4', text: 'Meo! Ứng dụng chạy 100% offline, không hacker nào chạm tới được.' },
      { id: 'cat_idle_5', text: 'Cần mã đăng nhập? Chạm nhẹ một cái là xong ngay, purr~' },
      { id: 'cat_idle_6', text: 'Tớ thích những thuật toán hoàn hảo... như kho mã của bạn vậy.' },
    ],
    COPIED: [
      { id: 'cat_copy_1', text: 'Đã sao chép mã! Dán nhanh trước khi mã đổi nhé. Purr~' },
      { id: 'cat_copy_2', text: 'Mã đã vào clipboard! Tuyệt đối chuẩn xác từng chữ số.' },
      { id: 'cat_copy_3', text: 'Sao chép thành công! Chuẩn xác như một cú vồ mồi của mèo.' },
      { id: 'cat_copy_4', text: 'Mã 2FA đã sẵn sàng! Đăng nhập an toàn nào.' },
      { id: 'cat_copy_5', text: 'Đã copy! Mã này chỉ tồn tại trong thời gian ngắn, bảo mật tối đa.' },
    ],
    WARNING: [
      { id: 'cat_warn_1', text: 'Chỉ còn 4 giây, copy ngay kẻo lỡ!' },
      { id: 'cat_warn_2', text: 'Khẩn cấp! Vòng lặp sắp hết, mã mới sắp thay thế!' },
      { id: 'cat_warn_3', text: 'Đồng hồ đếm ngược sắp chạm đáy! Nhanh tay nào!' },
      { id: 'cat_warn_4', text: 'Meo! Sắp hết thời gian hiệu lực rồi, nhanh lên nhé!' },
      { id: 'cat_warn_5', text: '3, 2, 1... Mã sắp đổi! Hãy copy ngay nếu cần!' },
    ],
    EMPTY: [
      { id: 'cat_empty_1', text: 'Kho mã đang trống trơn. Bấm nút [+] để thêm khóa bí mật đầu tiên nhé!' },
      { id: 'cat_empty_2', text: 'Chưa có tài khoản nào được bảo vệ. Hãy quét mã QR để bắt đầu nào!' },
      { id: 'cat_empty_3', text: 'Meo! Hãy đưa mã bí mật vào đây, tớ sẽ mã hóa cất vào két sắt.' },
      { id: 'cat_empty_4', text: 'Hòm thư bảo mật đang chờ bạn. Nhấn [+] phía trên để thêm mã mới!' },
    ],
    TIPS: [
      { id: 'cat_tip_1', text: 'Mẹo của Cipher Cat: Đừng bao giờ chụp màn hình lưu mã QR 2FA vào thư viện ảnh!', actionText: 'Mở Pet Academy' },
      { id: 'cat_tip_2', text: 'Mẹo bảo mật: Hãy xuất file sao lưu mã hóa .simpleotp và cất giữ cẩn thận.', actionText: 'Mở Pet Academy' },
      { id: 'cat_tip_3', text: 'Bạn có biết? TOTP = HMAC(Khóa bí mật + Thời gian). Hoàn toàn toán học, không cần internet!', actionText: 'Mở Pet Academy' },
      { id: 'cat_tip_4', text: 'Meow! Chạm vào tớ là muốn học thêm về 2FA đúng không? Xem ngay nhé!', actionText: 'Mở Pet Academy' },
    ],
  },
  'byte-dog': {
    IDLE: [
      { id: 'dog_idle_1', text: 'Gâu gâu! Em đang canh gác kho mã 24/7 cho sếp đây!' },
      { id: 'dog_idle_2', text: 'Không một gói tin lạ nào lọt qua được mắt em đâu sếp!' },
      { id: 'dog_idle_3', text: 'Mọi tài khoản đều an toàn trong vòng tay em, sếp yên tâm nhé!' },
      { id: 'dog_idle_4', text: 'Sếp cần lấy mã nào? Chỉ cần chạm một cái là em phục vụ ngay!' },
      { id: 'dog_idle_5', text: 'Gâu! Chúc sếp một ngày làm việc bảo mật và tràn đầy năng lượng!' },
      { id: 'dog_idle_6', text: 'Em đứng gác ở đây, hacker nào bén mảng tới là em sủa liền!' },
    ],
    COPIED: [
      { id: 'dog_copy_1', text: 'Gâu gâu! Đã sao chép mã rồi nhé sếp ơi!' },
      { id: 'dog_copy_2', text: 'Ngon lành! Mã đã nằm gọn gàng trong bộ nhớ tạm rồi!' },
      { id: 'dog_copy_3', text: 'Em đã tóm gọn mã cho sếp! Dán liền tay đăng nhập nào!' },
      { id: 'dog_copy_4', text: 'Gâu! Nhiệm vụ sao chép hoàn thành xuất sắc 100%!' },
      { id: 'dog_copy_5', text: 'Đã copy mã thành công! Sếp giỏi lắm, tiến lên nào!' },
    ],
    WARNING: [
      { id: 'dog_warn_1', text: 'Nhanh lên sếp ơi, sắp đổi mã mới rồi kìa!' },
      { id: 'dog_warn_2', text: 'Gâu gâu! Chỉ còn vài giây nữa thôi, khẩn cấp khẩn cấp!' },
      { id: 'dog_warn_3', text: 'Đồng hồ đang đỏ lòm rồi sếp ơi, chớp thời cơ copy ngay!' },
      { id: 'dog_warn_4', text: 'Sắp hết giờ rồi! Nhanh tay lên nào sếp ơi!' },
      { id: 'dog_warn_5', text: 'Gâu! 5 giây cuối cùng! Sếp copy kịp không nào?' },
    ],
    EMPTY: [
      { id: 'dog_empty_1', text: 'Kho mã đang trống vắng quá! Sếp bấm nút [+] cho em xin mã canh gác với!' },
      { id: 'dog_empty_2', text: 'Gâu! Em đang rảnh rỗi quá nè, sếp thêm mã 2FA vào đi em giữ cho!' },
      { id: 'dog_empty_3', text: 'Chưa có tài khoản nào cả! Quét ngay mã QR đầu tiên sếp ơi!' },
      { id: 'dog_empty_4', text: 'Gâu gâu! Em đang đợi nhận nhiệm vụ bảo vệ tài khoản đầu tiên đây!' },
    ],
    TIPS: [
      { id: 'dog_tip_1', text: 'Byte Dog nhắc nhở: Bật bảo vệ sinh trắc học để chỉ có sếp mới mở được kho mã nhé!', actionText: 'Mở Pet Academy' },
      { id: 'dog_tip_2', text: 'Tuyệt chiêu của Byte: Dùng mật khẩu dài kèm 2FA là cánh cửa bảo vệ hai lớp vững chắc!', actionText: 'Mở Pet Academy' },
      { id: 'dog_tip_3', text: 'Gâu! Đừng bao giờ chia sẻ mã 6 chữ số này cho bất kỳ ai gọi điện hỏi sếp nhé!', actionText: 'Mở Pet Academy' },
      { id: 'dog_tip_4', text: 'Sếp muốn nâng cao trình bảo mật không? Chạm vào em để mở Pet Academy nào!', actionText: 'Mở Pet Academy' },
    ],
  },
  'shield-bunny': {
    IDLE: [
      { id: 'bunny_idle_1', text: 'Mã của bạn đã được khiên bảo mật che chắn an toàn rồi nè!' },
      { id: 'bunny_idle_2', text: 'Tớ đang chú ý lắng nghe từng chuyển động... Mọi thứ đều bình yên.' },
      { id: 'bunny_idle_3', text: 'Khóa bảo mật nằm sâu trong vùng an toàn phần cứng, không ai lấy trộm được.' },
      { id: 'bunny_idle_4', text: 'Mỗi 30 giây tớ lại tạo ra chiếc khiên số mới cho bạn đó.' },
      { id: 'bunny_idle_5', text: 'Hãy luôn cẩn thận khi đăng nhập trên các thiết bị lạ nhé!' },
      { id: 'bunny_idle_6', text: 'Tớ luôn bên cạnh để bảo vệ các tài khoản quan trọng của bạn.' },
    ],
    COPIED: [
      { id: 'bunny_copy_1', text: 'Tớ đã giữ mã cẩn thận trong clipboard cho bạn rồi nè!' },
      { id: 'bunny_copy_2', text: 'Sao chép thành công rồi á! Bạn dán ngay vào biểu mẫu nhé.' },
      { id: 'bunny_copy_3', text: 'Chiếc khiên mã số đã sẵn sàng! Đăng nhập an toàn nha!' },
      { id: 'bunny_copy_4', text: 'Đã copy rồi! Tớ vui quá hihi~' },
      { id: 'bunny_copy_5', text: 'Mã đã được sao chép an toàn, bạn yên tâm sử dụng nhé!' },
    ],
    WARNING: [
      { id: 'bunny_warn_1', text: 'Ối ối, đồng hồ sắp hết giờ rồi! Nhanh tay lên bạn ơi!' },
      { id: 'bunny_warn_2', text: 'Thời gian còn ít lắm á, chỉ còn mấy giây thôi kìa!' },
      { id: 'bunny_warn_3', text: 'Mã sắp biến mất rồi, bạn mau dán nhanh vào nha!' },
      { id: 'bunny_warn_4', text: 'Khẩn cấp khẩn cấp! Chiếc khiên số sắp đổi vòng mới rồi!' },
      { id: 'bunny_warn_5', text: 'Ối ối! Còn chưa đầy 5 giây nữa thôi đó bạn ơi!' },
    ],
    EMPTY: [
      { id: 'bunny_empty_1', text: 'Kho mã chưa có gì nè... Bạn chạm vào nút [+] để tớ tạo khiên bảo vệ nhé!' },
      { id: 'bunny_empty_2', text: 'Tớ đang chuẩn bị sẵn chiếc khiên rồi, bạn thêm mã OTP đầu tiên đi!' },
      { id: 'bunny_empty_3', text: 'Hộp an toàn đang trống. Thêm một tài khoản để tớ bảo vệ bạn nào!' },
      { id: 'bunny_empty_4', text: 'Chưa có chiếc khiên nào được kích hoạt. Hãy nhấn [+] để bắt đầu nha!' },
    ],
    TIPS: [
      { id: 'bunny_tip_1', text: 'Shield Bunny khuyên bạn: Nhớ xuất file sao lưu mã hóa .simpleotp dự phòng nha!', actionText: 'Mở Pet Academy' },
      { id: 'bunny_tip_2', text: 'Bạn nhớ nè: Simple OTP chạy 100% offline, dữ liệu không bao giờ rời khỏi máy bạn đâu.', actionText: 'Mở Pet Academy' },
      { id: 'bunny_tip_3', text: 'Thỏ Khiên mách nhỏ: Mã HOTP chỉ đổi khi bấm làm mới, còn TOTP tự nhảy sau 30s đó!', actionText: 'Mở Pet Academy' },
      { id: 'bunny_tip_4', text: 'Bạn có muốn học thêm tuyệt chiêu bảo mật không? Mở Pet Academy cùng tớ nhé!', actionText: 'Mở Pet Academy' },
    ],
  },
};

/**
 * Returns the candidate dialogue pool based on pet, state, and tap status
 */
export function getDialoguePool(
  petId: PetId,
  state: PetState,
  isTap?: boolean,
  lang?: string
): PetDialogueItem[] {
  const currentLang = lang || i18n.language || 'vi';
  const catalogSource = currentLang.startsWith('en') ? PET_DIALOGUES_EN : PET_DIALOGUES;
  const safePetId: PetId = catalogSource[petId] ? petId : 'cipher-cat';
  const petCatalog = catalogSource[safePetId];

  let category: PetState | 'TIPS' = state;
  if (isTap && state === 'IDLE') {
    category = Math.random() < 0.5 ? 'TIPS' : 'IDLE';
  } else if (isTap && state === 'EMPTY') {
    category = 'EMPTY';
  }

  return petCatalog[category] || petCatalog.IDLE;
}

/**
 * Selects a dialogue item with anti-repetition filter
 */
export function getDialogueItem(
  petId: PetId,
  state: PetState,
  options?: DialogueSelectionOptions & { lang?: string }
): PetDialogueItem {
  const pool = getDialoguePool(petId, state, options?.isTap, options?.lang);
  if (pool.length <= 1) return pool[0];

  const filtered = options?.previousId
    ? pool.filter((item) => item.id !== options.previousId)
    : pool;

  const candidates = filtered.length > 0 ? filtered : pool;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

/**
 * Alias for getDialogueItem
 */
export const getRandomDialogue = getDialogueItem;
