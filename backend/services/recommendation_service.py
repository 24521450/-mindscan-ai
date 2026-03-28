def generate_recommendations(features: dict, stress_level: int) -> list:
    recommendations = []

    def get_f(key, default=0):
        return features.get(key, default)

    # High stress — khuyến nghị khẩn cấp
    if stress_level >= 2:
        recommendations.append({
            "category": "Hỗ trợ khẩn cấp",
            "title": "Tìm kiếm hỗ trợ chuyên nghiệp",
            "description": "Mức độ căng thẳng của bạn đang ở mức cao. Hãy liên hệ đường dây hỗ trợ tâm lý 1800 599 920 hoặc đến phòng tư vấn tâm lý của trường."
        })

    # Giấc ngủ — dùng sleep_quality (thang 0–5)
    sleep = get_f('sleep_quality', 3)
    if sleep < 2:
        recommendations.append({
            "category": "Giấc ngủ",
            "title": "Cải thiện chất lượng giấc ngủ",
            "description": "Chất lượng giấc ngủ của bạn đang ở mức thấp — điều này ảnh hưởng lớn đến stress. Hãy xây dựng lịch ngủ đều đặn và hạn chế màn hình 1 giờ trước khi ngủ."
        })

    # Học tập — dùng study_load (0–5) và academic_performance (0–5)
    study_load = get_f('study_load', 0)
    academic_perf = get_f('academic_performance', 3)
    if study_load > 3 or academic_perf < 2:
        recommendations.append({
            "category": "Học tập",
            "title": "Quản lý áp lực học tập",
            "description": "Khối lượng học tập đang ở mức cao. Hãy tận dụng các nhóm học tập, lên kế hoạch ôn thi sớm và nhớ sắp xếp thời gian nghỉ ngơi hợp lý."
        })

    # Lo âu — dùng anxiety_level (0–21)
    anxiety = get_f('anxiety_level', 0)
    if anxiety > 10:
        recommendations.append({
            "category": "Sức khỏe tâm thần",
            "title": "Kiểm soát lo âu",
            "description": "Chỉ số lo âu của bạn đang ở mức đáng chú ý. Hãy thử các bài tập hơi thở 4-7-8, thiền định, hoặc viết nhật ký cảm xúc hàng ngày."
        })

    # Trầm cảm — dùng depression (0–27)
    depression = get_f('depression', 0)
    if depression > 10:
        recommendations.append({
            "category": "Sức khỏe tâm thần",
            "title": "Chú ý đến sức khỏe tinh thần",
            "description": "Điểm số trầm cảm của bạn cho thấy bạn có thể đang trải qua giai đoạn khó khăn. Đừng ngần ngại tìm đến chuyên gia tâm lý hoặc tâm sự với người thân."
        })

    # Hỗ trợ xã hội — social_support (0–3)
    social_support = get_f('social_support', 2)
    if social_support < 1:
        recommendations.append({
            "category": "Xã hội",
            "title": "Tăng cường kết nối xã hội",
            "description": "Sự thiếu hỗ trợ từ người thân và bạn bè làm tăng cảm giác căng thẳng. Hãy tham gia câu lạc bộ, nhóm học tập hoặc dành thời gian với bạn bè ít nhất 2 lần/tuần."
        })

    # Bắt nạt — bullying (0–5)
    bullying = get_f('bullying', 0)
    if bullying > 2:
        recommendations.append({
            "category": "Môi trường",
            "title": "Đối phó với áp lực từ môi trường",
            "description": "Bắt nạt hoặc áp lực từ người xung quanh có thể gây tổn thương lớn. Hãy chia sẻ với giáo viên, nhân viên tư vấn hoặc đường dây hỗ trợ học sinh."
        })

    # Điều kiện môi trường sống — living_conditions, safety, basic_needs (0–5)
    living = get_f('living_conditions', 3)
    safety = get_f('safety', 3)
    basic_needs = get_f('basic_needs', 3)
    if living < 2 or safety < 2 or basic_needs < 2:
        recommendations.append({
            "category": "Môi trường sống",
            "title": "Cải thiện điều kiện sống",
            "description": "Điều kiện sống, sự an toàn hoặc nhu cầu cơ bản của bạn đang bị ảnh hưởng. Hãy liên hệ phòng công tác sinh viên để được hỗ trợ về chỗ ở và các nhu cầu thiết yếu."
        })

    # Mặc định nếu không có gợi ý nào khớp
    if not recommendations:
        recommendations.append({
            "category": "Học tập",
            "title": "Duy trì lối sống cân bằng",
            "description": "Các chỉ số của bạn đang ở mức ổn. Tiếp tục duy trì thói quen lành mạnh hiện tại và đừng quên nghỉ ngơi đầy đủ!"
        })

    return recommendations
